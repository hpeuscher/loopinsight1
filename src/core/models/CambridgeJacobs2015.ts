/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { ModuleProfile } from '../../types/ModuleProfile.js'
import ODEPatientModel from '../../types/ODEPatientModel.js'
import {
    TypedPatientState, PatientInput, PatientOutput
} from '../../types/Patient.js'
import AbstractODEPatient, { createPatientFromODE } from '../AbstractODEPatient.js'

export const profile: ModuleProfile = {
    type: "patient",
    id: "CambridgeJacobs2015",
    version: "2.0.0",
    name: "Jacobs 2015",
    extends: "Cambridge"
}

/**
 * Class representing virtual patient according to Jacobs (2015), based on
 * Cambridge/Hovorka model.
 * 
 * Scientific sources:
 * 
 * [Jacobs, JDST, 2015]
 *     Jacobs, P.G. et al.
 *     "Incorporating an Exercise Detection, Grading, and Hormone Dosing
 *      Algorithm Into the Artificial Pancreas Using Accelerometry and Heart Rate"
 *     Journal of Diabetes Science and Technology, Volume 9, Issue 6, 2015
 * 
 * [Hovorka, 2004]
 *     Hovorka, R. et al.
 *     "Nonlinear model predictive control of glucose concentration in 
 *      subjects with type 1 diabetes"
 *     Physiological measurement, Volume 25, Number 4, 2004
 * 
 * [Lenart; Parker 2002]
 *     Lenart, P.J.; Parker, R. S.
 *     "MODELING EXERCISE EFFECTS IN TYPE 1 DIABETIC PATIENTS"
 *     Elsevier, 2002
 * 
 * [Hernandez-Ordonez; Campos-Delgado, 2008]
 *     Hernandez-Ordonez, M.; Campos-Delgado, D. U.
 *     "An extension to the compartmental model of type 1 diabetic patients to
 *      reproduce exercise periods with glycogen depletion and replenishment"
 *     Journal of Biomechanics, 2008
 * 
 */
export class Jacobs2015
    extends AbstractODEPatient
    <typeof stateDescription, typeof parameterDescription>
    implements ODEPatientModel<State> {

    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array<keyof PatientInput> {
        return ["carbs", "iir"]
    }

    getOutputList(): Array<keyof PatientOutput> {
        return ["Gp"]
    }

    getStateDescription() {
        return stateDescription
    }

    getParameterDescription() {
        return parameterDescription
    }

    computeIIR(targetBG: number): number {
        const params = this.getParameterValues()
        /** equilibrium blood glucose levels in mmol/l */
        const Gpeq = targetBG / mmolG2mg * 10
        const Q1eq = Gpeq * params.VG * params.BW
        const F01eq = params.F01 * params.BW * Math.min(Gpeq / 4.5, 1)
        const EGP0 = params.EGP0 * params.BW

        const a = - Q1eq * params.SIT * params.SID - EGP0 * params.SID * params.SIE
        const b = -F01eq * params.SID - params.k12 * Q1eq * params.SIT
            + params.k12 * params.SIT * Q1eq
            + EGP0 * params.SID - EGP0 * params.k12 * params.SIE
        const c = -F01eq * params.k12 + EGP0 * params.k12
        const Ieq = (-b - Math.sqrt(b * b - 4 * a * c)) / 2 / a

        const Seq = params.tmaxI * (params.VI * params.BW) * params.ke * Ieq

        return Seq / params.tmaxI / 1000 * 60
    }

    computeSteadyState(u: PatientInput): State {
        const params = this.getParameterValues()
        /** equilibrium blood glucose levels in mmol/l */
        const Gpeq = params.Gpeq / mmolG2mg * 10
        const F01eq = params.F01 * params.BW * Math.min(Gpeq / 4.5, 1)
        const Seq = (u.iir || 0) * params.tmaxI * 1000 / 60
        const Ieq = Seq / (params.tmaxI * (params.VI * params.BW) * params.ke)
        const x1eq = params.SIT * Ieq
        const x2eq = params.SID * Ieq
        const x3eq = params.SIE * Ieq
        console.assert(x2eq > 0)
        const Q2eq = -(F01eq - params.EGP0 * params.BW * (1 - x3eq)) / x2eq
        console.assert(Q2eq > 0)
        const Q1eq = Q2eq / x1eq * (params.k12 + x2eq)

        return {
            "Q1": Q1eq,			// mass in accessible compartment (plasma) in mmol
            "Q2": Q2eq,			// mass in non-accessible compartment in mmol
            "S1": Seq,			// amount of insulin in compartment 1 in mU
            "S2": Seq,			// amount of insulin in compartment 2 in mU
            "I": Ieq,			// plasma insulin in mU/L
            "x1": x1eq,			// insulin action on glucose transport in 1/min
            "x2": x2eq,			// insulin action on glucose disposal in 1/min
            "x3": x3eq,			// insulin action on endogenous glucose production in 1
            "D1": 0,			// glucose in compartment 1 in mmol
            "D2": 0,			// glucose in compartment 2 in mmol
            "ΓPGUA": -10.1958,	// glucose uptake due to exercise
            "ΓHGPA": -10.1958,	// glucose production due to exercise
            "PVO2max": 0,		// percentage of volumen of oxygen consumed
        }
    }

    computeDerivatives(_t: Date, x: State, u: PatientInput): State {

        const params = this.getParameterValues()

        // inputs
        /** meal ingestion in mg/min */
        const M = (u.carbs || 0) * 1000 / mmolG2mg
        /** insulin infusion rate in mU/min */
        const IIR = (u.iir || 0) * 1000 / 60
        /** exercise intensity */
        const intensity = (u.exercise || 0) / 100
        const PAMM = intensity


        // plasma glucose concentration
        const G = x.Q1 / (params.VG * params.BW) // in mmol/L

        // total non-insulin-dependent glucose ﬂux corrected for the ambient glucose concentration in mmol/min
        const F01c = params.F01 * params.BW * Math.min(G / 4.5, 1)

        // renal glucose clearance
        const FR = Math.max(0, 0.003 * (G - 9))

        // gut absorption rate
        const UG = x.D2 / params.tmaxG

        // multipliers for exercise effects 
        // multiplier for exercise-induced peripheral glucose uptake [Lenart; Parker 2002]
        const MPGU = 1 + x.ΓPGUA * PAMM / params.PGUb

        // multiplier for exercise-induced peripheral insulin uptake [Lenart; Parker 2002]
        const MPIU = 1 + 2.4 * PAMM

        // multiplier for exercise-induced hepatic glucose production [Lenart; Parker 2002]
        const MHGP = 1 + x.ΓHGPA * PAMM / params.HGPb

        // steady state plateau for exercise-induced glucose uptake [Jacobs, JDST, 2015]
        const ΓPGUA_ = 0.006 * Math.pow(x.PVO2max, 2) + 1.2264 * x.PVO2max - 10.1958

        // steady state plateau for exercise-induced glucose production [Jacobs, JDST, 2015]
        const ΓHGPA_ = 0.006 * Math.pow(x.PVO2max, 2) + 1.2264 * x.PVO2max - 10.1958


        const kb1 = params.ka1 * params.SIT // in 1/min^2/(mU/L)
        const kb2 = params.ka2 * params.SID // in 1/min^2/(mU/L)
        const kb3 = params.ka3 * params.SIE

        // return vector of derivatives dx/dt
        return {

            // insulin subsystem
            // amount of insulin in compartment 1 in mU
            S1: - x.S1 / params.tmaxI + IIR,
            // amount of insulin in compartment 2 in mU
            S2: (x.S1 - x.S2) / params.tmaxI,

            // mass in accessible compartment (plasma) in mmol
            Q1: - F01c - x.x1 * x.Q1 + params.k12 * x.Q2
                - FR + UG + params.EGP0 * params.BW * (1 - x.x3),

            // mass in non-accessible compartment in mmol
            Q2: x.x1 * x.Q1 - (params.k12 + x.x2) * x.Q2,

            // plasma insulin in mU/L
            I: x.S2 / params.tmaxI / (params.VI * params.BW) - params.ke * x.I,

            // exercise subsystem [Hernandez-Ordonez; Campos-Delgado, 2008]
            // percentage of oxygen consumed
            PVO2max: -5 / 3 * x.PVO2max + 5 / 3 * intensity, 	//*** 

            // exercise-induced glucose uptake
            ΓPGUA: -1 / 30 * x.ΓPGUA + 1 / 30 * ΓPGUA_,

            // exercise-induced glucose production
            ΓHGPA: -1 / 30 * x.ΓHGPA + 1 / 30 * ΓHGPA_,

            // insulin/glucose distribution/transport
            x1: -params.ka1 * x.x1 + MPGU * MPIU * kb1 * x.I,

            // glucose disposal
            x2: -params.ka2 * x.x2 + MPGU * MPIU * kb2 * x.I,

            // endogenous glucose production in 1/min/(mU/L
            x3: -params.ka3 * x.x3 + MHGP * kb3 * x.I,

            // meal subsystem
            // glucose in compartment 1 in mmol
            D1: - x.D1 / params.tmaxG + M * params.AG,
            // glucose in compartment 2 in mmol
            D2: (x.D1 - x.D2) / params.tmaxG,

        }
    }

    computeOutput(_t: Date, x: State): PatientOutput {
        const params = this.getParameterValues()
        return {
            Gp: x.Q1 / (params.VG * params.BW) * mmolG2mg / 10,
        }
    }

}

/** Conversion factor between mmol glucose and mg glucose */
const mmolG2mg = 180.16

/** Description of parameters. */
const parameterDescription = {
    "Gpeq": { unit: "mg/dl", default: 100, },
    "BW": { unit: "kg", default: 75, },
    "k12": { unit: "1/min", default: 0.066, },
    "ka1": { unit: "1/min", default: 0.006, },
    "ka2": { unit: "1/min", default: 0.06, },
    "ka3": { unit: "1/min", default: 0.03, },
    "ke": { unit: "1/min", default: 0.138, },
    "VI": { unit: "l/kg", default: 0.12, },
    "VG": { unit: "l/kg", default: 0.16, },
    "AG": { unit: "1", default: 0.8, },
    "tmaxG": { unit: "min", default: 40, },
    "SIT": { unit: "1/min/mU/L", default: 51.2e-4, },
    "SID": { unit: "1/min/mU/L", default: 8.2e-4, },
    "SIE": { unit: "1/mU/L", default: 520e-4, },
    "EGP0": { unit: "mmol/kg/min", default: 0.0161, },
    "F01": { unit: "mmol/kg/min", default: 0.0097, },
    "tmaxI": { unit: "min", default: 55, },
    "PGUb": { unit: "mg/min", default: 35, }, // [Lenart; Parker 2002]
    "HGPb": { unit: "mg/min", default: 155, }, // [Lenart; Parker 2002]
}

/** Description of state variables. */
const stateDescription = {
    /** mass in accessible compartment (plasma) in mmol */
    "Q1": { unit: "mmol" },
    /** mass in non-accessible compartment in mmol */
    "Q2": { unit: "mmol" },
    /** amount of insulin in compartment 1 in mU */
    "S1": { unit: "mU" },
    /** amount of insulin in compartment 2 in mU */
    "S2": { unit: "mU" },
    /** plasma insulin in mU/l */
    "I": { unit: "mU/l" },
    /** insulin action on glucose transport in 1/min */
    "x1": { unit: "1/min" },
    /** insulin action on glucose disposal in 1/min */
    "x2": { unit: "1/min" },
    /** insulin action on endogenous glucose production in 1 */
    "x3": { unit: "1" },
    /** glucose in compartment 1 in mmol */
    "D1": { unit: "mmol" },
    /** glucose in compartment 2 in mmol */
    "D2": { unit: "mmol" },
    /** glucose uptake due to exercise */
    "ΓPGUA": { unit: "" },
    /** glucose production due to exercise */
    "ΓHGPA": { unit: "" },
    /** percentage of volume of oxygen consumed */
    "PVO2max": { unit: "" },
}

/** Type for patient state, i.e. numeric values of the state variables. */
type State = TypedPatientState<typeof stateDescription>

/** Use mixin to create Patient from ODEPatientModel. */
export default createPatientFromODE
    <typeof stateDescription, typeof parameterDescription>
    (Jacobs2015)
