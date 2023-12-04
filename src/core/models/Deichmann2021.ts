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
    id: "Deichmann2021",
    version: "2.0.0",
    name: "Deichmann 2021",
}

/**
 * Class representing virtual patient as described by Deichmann et al. (2021).
 * 
 * [Deichmann, 2021]
 *  Deichmann, J.; Bachmann, S.; Burckhardt, M.-A.; Szinnai, G.; Kaltenbach, H.-M.
 *  "Simulation-Based Evaluation of Treatment Adjustment to Exercise in Type 1 Diabetes"
 *  Frontiers in Endocrinology, 2021.
 * 
 */
export class Deichmann2021
    extends AbstractODEPatient
        <typeof stateDescription, typeof parameterDescription> 
    implements ODEPatientModel<State> {

    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array<keyof PatientInput> {
        return ["carbs", "iir", "exercise"]
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

    computeIIR(targetBG: number, _t: Date): number {
        const params = this.getParameterValues()
        return params.Ib * (params.kd + params.ka) / params.ka *
            (params.Vi * params.BW) * params.ke * 60e-6 // uU/min -> U/h
    }

    computeSteadyState(u: PatientInput, _t: Date): State {
        const params = this.getParameterValues()
        const Xt = - params.p1 * (params.Gpeq - params.Gb) / params.Gpeq
        return {
            "x1": 0,
            "x2": 0,
            "Ic": 0,
            "X": Xt,
            "G": params.Gpeq,
            "Y": 0,
            "Z": 0,
            "D1": 0,
            "D2": 0,
            "HRint": 0,
        }
    }

    computeDerivatives(_t: Date, x: State, u: PatientInput): State {

        const params = this.getParameterValues()

        // inputs
        /** meal ingestion in mg/min */
        const M = (u.carbs || 0) * 1000
        /** insulin infusion rate in µU/min */
        const IIR = (u.iir || 0) * 1e6 / 60
        /** exercise intensity in % */
        const u_ex = u.exercise || 0

        /** heart rate */
        const HR = params.HRb + (params.HRmax - params.HRb) * u_ex / 100

        // basal and target reference levels
        const Xt = - params.p1 * (params.Gpeq - params.Gb) / params.Gpeq
        const It = params.p2 / params.p3 * Xt
        const Xb = params.Ib * params.p3 / params.p2

        // insulin kinetics
        const IIRb = params.Ib * (params.kd + params.ka) / params.ka *
            (params.Vi * params.BW) * params.ke  // uU/min -> U/h
        
        // 
        const Ra = x.D2 / params.tau_m
        const f = 1 / (1 + Math.pow(params.a * params.HRb / x.Y, params.n))
        const deltaI = It + x.Ic - 0 * params.Ib

        // declare and return vector of derivatives dx/dt
        return {
            x1: - params.k21 * x.x1 + IIR - IIRb,
            x2: + params.k21 * x.x1 - (params.kd + params.ka) * x.x2,
            Ic: params.ka / (params.Vi * params.BW) * x.x2 - params.ke * x.Ic,

            // meal subsystem / gut absorption
            D1: - x.D1 / params.tau_m + M * params.AG,
            D2: (x.D1 - x.D2) / params.tau_m,

            // glucose-insulin dynamics
            X: - params.p2 * x.X + params.p3 * deltaI,
            G: - params.p1 * (x.G - params.Gb)
                - x.X * x.G
                - params.alpha * x.HRint * x.Z * (x.X + Xb) * x.G
                - params.beta * x.Y * x.G
                + Ra / (params.Vg * params.BW),

            // exercise subsystem
            Y: (HR - params.HRb - x.Y) / params.tauHR,
            Z: -(f + 1 / params.tau) * x.Z + f,
            HRint: HR - params.HRb,
        }
    }

    computeOutput(_t: Date, x: State): PatientOutput {
        return {
            Gp: x.G
        }
    }

}

/** Description of parameters. */
const parameterDescription = {
    "Gpeq": { unit: "mg/dl", default: 100, step: 10},
    "BW":   { unit: "kg", default: 70, step: 5},
    "p1": { unit: "1/min", default: 0.0041, },
    "p2": { unit: "1/min", default: 0.0155, },
    "p3": { unit: "1/min^2 / (uU/ml)", default: 6.913e-6, },
    "Gb": { unit: "mg/dl", default: 172, },
    "alpha": { unit: "1/bpm", default: 2.59e-4, },
    "beta": { unit: "1/bpm", default: 3.39e-4, },
    "tauHR": { unit: "min", default: 5, },
    "tau": { unit: "min", default: 600, },
    "a": { unit: "1", default: 0.1, },
    "n": { unit: "1", default: 4, },
    "AG": { unit: "", default: 0.8, },	// bio-availability ("f")
    "Vg": { unit: "dl/kg", default: 1.6, },
    "tau_m": { unit: "min", default: 60, },
    "k21": { unit: "1/min", default: 0.0085, },
    "kd": { unit: "1/min", default: 0.0247, },
    "ka": { unit: "1/min", default: 0.011, },
    "ke": { unit: "1/min", default: 0.0357, },
    "Vi": { unit: "ml/kg", default: 104, },
    "Ib": { unit: "uU/ml", default: 10, },
    "HRb": { unit: "bpm", default: 80, },
    "HRmax": { unit: "bpm", default: 200, },	// (##)
}

/** Description of state variables. */
const stateDescription = {
    "x1": { unit: "" },
    "x2": { unit: "" },
    "Ic": { unit: "" },
    "X": { unit: "" },
    "G": { unit: "" },
    "Y": { unit: "" },
    "Z": { unit: "" },
    "D1": { unit: "" },
    "D2": { unit: "" },
    /** integral of heart rate */
    "HRint": { unit: "" },
}

/** Type for patient state, i.e. numeric values of the state variables. */
type State = TypedPatientState<typeof stateDescription>

/** Use mixin to create Patient from ODEPatientModel. */
export default createPatientFromODE
    <typeof stateDescription, typeof parameterDescription>
    (Deichmann2021)
