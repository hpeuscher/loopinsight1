/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { ModuleProfile } from '../../types/ModuleProfile.js'
import ODEPatientModel from '../../types/ODEPatientModel.js'
import {
    PatientInput, PatientOutput,
    TypedPatientState
} from '../../types/Patient.js'
import AbstractODEPatient, {
    createPatientFromODE
} from '../AbstractODEPatient.js'

export const profile: ModuleProfile = {
    type: "patient",
    id: "Cambridge",
    version: "2.0.0",
    name: "Cambridge",
}

/**
 * Class that describes physiological model of virtual patient according to
 * Hovorka et al. ("Cambridge model"). 
 * 
 * Scientific sources:
 * 
 * [Hovorka, 2004]
 *     Hovorka, R. et al.
 *     "Nonlinear model predictive control of glucose concentration in 
 *      subjects with type 1 diabetes"
 *     Physiological measurement, Volume 25, Number 4, 2004
 * 
 * [Andersen, 2014]
 *     Andersen, S. H.
 *     "Software for in Silico Testing of an Artificial Pancreas"
 *     Master's Thesis, Technical University of Denmark, 2014
 * 
 */
export class Cambridge
    extends AbstractODEPatient
    <typeof stateDescription, typeof parameterDescription>
    implements ODEPatientModel<State>
{

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

    computeIIR(targetBG: number, _t?: Date): number {
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

    computeSteadyState(u: PatientInput, _t?: Date): State {
        const params = this.getParameterValues()
        /** equilibrium blood glucose levels in mmol/l */
        const Gpeq = params.Gpeq / mmolG2mg * 10
        const F01eq = params.F01 * params.BW * Math.min(Gpeq / 4.5, 1)
        const Seq = (u.iir || 0) * params.tmaxI * 1000 / 60
        const Ieq = Seq / (params.tmaxI * (params.VI * params.BW) * params.ke)
        const x1eq = params.SIT * Ieq
        const x2eq = params.SID * Ieq
        const x3eq = params.SIE * Ieq
        console.assert(x2eq > 0)    // TODO
        const Q2eq = -(F01eq - params.EGP0 * params.BW * (1 - x3eq)) / x2eq
        console.assert(Q2eq > 0)    // TODO
        const Q1eq = Q2eq / x1eq * (params.k12 + x2eq)

        return {
            Q1: Q1eq,
            Q2: Q2eq,
            S1: Seq,
            S2: Seq,
            I: Ieq,
            x1: x1eq,
            x2: x2eq,
            x3: x3eq,
            D1: 0,
            D2: 0,
        }
    }

    computeDerivatives(_t: Date, x: State, u: PatientInput): State {
        /** model parameters */
        const params = this.getParameterValues()

        // inputs
        /** meal ingestion in mmol/min */
        const M = (u.carbs || 0) / mmolG2mg * 1000
        /** insulin infusion rate in mU/min */
        const IIR = (u.iir || 0) * 1000 / 60
        /** plasma glucose concentration in mmol/l */
        const G = x.Q1 / (params.VG * params.BW)
        /**
         * total non-insulin-dependent glucose ﬂux corrected for the ambient 
         * glucose concentration in mmol/min
         */
        const F01c = params.F01 * params.BW * Math.min(G / 4.5, 1)
        /** renal glucose clearance */
        const FR = Math.max(0, 0.003 * (G - 9))
        /** gut absorption rate */
        const UG = x.D2 / params.tmaxG
        /** kb1 in 1/min^2/(mU/l) */
        const kb1 = params.ka1 * params.SIT
        /** kb2 in 1/min^2/(mU/l) */
        const kb2 = params.ka2 * params.SID
        /** kb3 in 1/min/(mU/l) */
        const kb3 = params.ka3 * params.SIE

        // compute and return vector of derivatives dx/dt
        return {
            // insulin subsystem
            S1: - x.S1 / params.tmaxI + IIR,
            S2: (x.S1 - x.S2) / params.tmaxI,
            I: x.S2 / params.tmaxI / (params.VI * params.BW) - params.ke * x.I,

            // glucose subsystem
            Q1: - F01c - x.x1 * x.Q1 + params.k12 * x.Q2
                - FR + UG + params.EGP0 * params.BW * (1 - x.x3),
            Q2: x.x1 * x.Q1 - (params.k12 + x.x2) * x.Q2,
            x1: -params.ka1 * x.x1 + kb1 * x.I,
            x2: -params.ka2 * x.x2 + kb2 * x.I,
            x3: -params.ka3 * x.x3 + kb3 * x.I,

            // meal subsystem
            D1: - x.D1 / params.tmaxG + M * params.AG,
            D2: (x.D1 - x.D2) / params.tmaxG
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
    /** homeostatic glucose concentration in plasma */
    "Gpeq": { unit: "mg/dl", default: 100, step: 10 },
    /** body weight in kg */
    "BW": { unit: "kg", default: 75 },
    /** transfer rate from the non-accessible to the accessible compartment */
    "k12": { unit: "1/min", default: 0.066 },
    /** deactivation rate */
    "ka1": { unit: "1/min", default: 0.006 },
    /** deactivation rate */
    "ka2": { unit: "1/min", default: 0.06 },
    /** deactivation rate */
    "ka3": { unit: "1/min", default: 0.03 },
    /** insulin elimination from plasma */
    "ke": { unit: "1/min", default: 0.138 },
    /** insulin distribution volume */
    "VI": { unit: "l/kg", default: 0.12 },
    /** distribution volume of the accessible compartment */
    "VG": { unit: "l/kg", default: 0.16 },
    /** carbohydrate (CHO) bioavailability */
    "AG": { unit: "1", default: 0.8 },
    /** time-to-maximum of CHO absorption */
    "tmaxG": { unit: "min", default: 40 },
    /** insulin sensitivity of distribution/transport */
    "SIT": { unit: "1/min/mU/l", default: 51.2e-4 },
    /** insulin sensitivity of disposal */
    "SID": { unit: "1/min/mU/l", default: 8.2e-4 },
    /** insulin sensitivity of EGP */
    "SIE": { unit: "1/mU/l", default: 520e-4 },
    /** endogenous glucose production extrapolated to zero insulin concentration */
    "EGP0": { unit: "mmol/kg/min", default: 0.0161 },
    /** non-insulin-dependent glucose ﬂux */
    "F01": { unit: "mmol/kg/min", default: 0.0097 },
    /** time-to-maximum of absorption of subcut. injected short-acting insulin */
    "tmaxI": { unit: "min", default: 55 },
}

/** Description of state variables. */
const stateDescription = {
    /** mass in accessible compartment (plasma) in mmol */
    Q1: { unit: "mmol" },
    /** mass in non-accessible compartment in mmol */
    Q2: { unit: "mmol" },
    /** amount of insulin in compartment 1 in mU */
    S1: { unit: "mU" },
    /** amount of insulin in compartment 2 in mU */
    S2: { unit: "mU" },
    /** plasma insulin in mU/l */
    I: { unit: "mU/l" },
    /** insulin action on glucose transport in 1/min */
    x1: { unit: "1/min" },
    /** insulin action on glucose disposal in 1/min */
    x2: { unit: "1/min" },
    /** insulin action on endogenous glucose production in 1 */
    x3: { unit: "1" },
    /** glucose in compartment 1 in mmol */
    D1: { unit: "mmol" },
    /** glucose in compartment 2 in mmol */
    D2: { unit: "mmol" },
}

/** Type for patient state, i.e. numeric values of the state variables. */
type State = TypedPatientState<typeof stateDescription>

/** Use mixin to create Patient from ODEPatientModel. */
export default createPatientFromODE
    <typeof stateDescription, typeof parameterDescription>
    (Cambridge)


/** HTML representation of identifiers (state variables, parameters). */
export const html = {
    /* states */
    "Q1": "Q<sub>1</sub>",
    "Q2": "Q<sub>2</sub>",
    "S1": "S<sub>1</sub>",
    "S2": "S<sub>2</sub>",
    "I": "I",
    "x1": "x<sub>1</sub>",
    "x2": "x<sub>2</sub>",
    "x3": "x<sub>3</sub>",
    "D1": "D<sub>1</sub>",
    "D2": "D<sub>2</sub>",
    /* parameters */
    "Gpeq": "G<sub>p,eq</sub>",
    "BW": "BW",
    "k12": "k<sub>12</sub>",
    "ka1": "k<sub>a1</sub>",
    "ka2": "k<sub>a2</sub>",
    "ka3": "k<sub>a3</sub>",
    "ke": "k<sub>e</sub>",
    "VI": "V<sub>I</sub>",
    "VG": "V<sub>G</sub>",
    "AG": "A<sub>G</sub>",
    "tmaxG": "t<sub>max,G</sub>",
    "SIT": "S<sub>IT</sub>",
    "SID": "S<sub>ID</sub>",
    "SIE": "S<sub>IE</sub>",
    "EGP0": "EGP<sub>0</sub>",
    "F01": "F<sub>01</sub>",
    "tmaxI": "t<sub>max,I</sub>",
}

/** Additional information to be displayed in tooltips. */
export const i18n_tooltip = {
    en: {
        "name": "Cambridge",
        /* states */
        "Q1": "mass in accessible compartment (plasma)",
        "Q2": "mass in non-accessible compartment",
        "S1": "amount of insulin in compartment 1",
        "S2": "amount of insulin in compartment 2",
        "I": "plasma insulin",
        "x1": "insulin action on glucose transport",
        "x2": "insulin action on glucose disposal",
        "x3": "insulin action on endogenous glucose production",
        "D1": "glucose in compartment 1",
        "D2": "glucose in compartment 2",
        /* parameters */
        "Gpeq": "steady-state of glucose in plasma",
        "BW": "body weight",
        "k12": "transfer rate from the non-accessible to the accessible compartment",
        "ka1": "deactivation rate",
        "ka2": "deactivation rate",
        "ka3": "deactivation rate",
        "ke": "insulin elimination from plasma",
        "VI": "insulin distribution volume",
        "VG": "distribution volume of the accessible compartment",
        "AG": "carbohydrate (CHO) bioavailability",
        "tmaxG": "time-to-maximum of CHO absorption",
        "SIT": "insulin sensitivity of distribution/transport",
        "SID": "insulin sensitivity of disposal",
        "SIE": "insulin sensitivity of EGP",
        "EGP0": "endogenous glucose production (EGP) extrapolated to the zero insulin concentration",
        "F01": "non-insulin-dependent glucose ﬂux",
        "tmaxI": "time-to-maximum of absorption of subcutaneously injected short-acting insulin",
        /* signals */
        "EGP": "endogenous glucose production",
    },

    de: {
        "name": "Cambridge / Cambridge",
        /* states */
        "Q1": "mass in accessible compartment (plasma)",
        "Q2": "mass in non-accessible compartment",
        "S1": "amount of insulin in compartment 1",
        "S2": "amount of insulin in compartment 2",
        "I": "plasma insulin",
        "x1": "insulin action on glucose transport",
        "x2": "insulin action on glucose disposal",
        "x3": "insulin action on endogenous glucose production",
        "D1": "glucose in compartment 1",
        "D2": "glucose in compartment 2",
        /* parameters */
        "Gpeq": "Glukose im Plasma im Gleichgewicht",
        "BW": "Körpergewicht",
        "k12": "transfer rate from the non-accessible to the accessible compartment",
        "ka1": "deactivation rate",
        "ka2": "deactivation rate",
        "ka3": "deactivation rate",
        "ke": "insulin elimination from plasma",
        "VI": "insulin distribution volume",
        "VG": "distribution volume of the accessible compartment",
        "AG": "Bioverfügbarkeit der Kohlenhydrate",
        "tmaxG": "time-to-maximum of CHO absorption",
        "SIT": "Insulinsensitivität of distribution/transport",
        "SID": "Insulinsensitivität of disposal",
        "SIE": "Insulin sensitivity of EGP",
        "EGP0": "endogenous glucose production (EGP) extrapolated to the zero insulin concentration",
        "F01": "non-insulin-dependent glucose ﬂux",
        "tmaxI": "time-to-maximum of absorption of subcutaneously injected short-acting insulin",
        /* signals */
        "EGP": "endogene Glukoseproduktion",
    },
}

/** Description of diagram that illustrates model structure. */
export const diagram = {

    subsystems: [
        { x: 60, y: 110, width: 330, height: 100, fill: "#DDDDFF", label: { text: "endogenous glucose production" } },
        { x: 400, y: 10, width: 320, height: 390, fill: "#FFDDDD", label: { text: "glucose subsystem" } },
        { x: 60, y: 300, width: 330, height: 100, fill: "#DDFFCC", label: { text: "insulin pharmacokinetics" } },
        { x: 60, y: 10, width: 330, height: 90, fill: "#FFDD55", label: { text: "meal subsystem" } },
    ],

    nodes: {
        "Q1": { x: 500, y: 150, geometry: { shape: "circle", d: 50 } },
        "Q2": { x: 600, y: 150, geometry: { shape: "circle", d: 50 } },
        "S1": { x: 150, y: 350, geometry: { shape: "circle", d: 50 } },
        "S2": { x: 250, y: 350, geometry: { shape: "circle", d: 50 } },
        "I": { x: 350, y: 350, geometry: { shape: "circle", d: 50 } },
        "x3": { x: 450, y: 250, geometry: { shape: "circle", d: 50 } },
        "x1": { x: 550, y: 250, geometry: { shape: "circle", d: 50 } },
        "x2": { x: 650, y: 250, geometry: { shape: "circle", d: 50 } },
        "D1": { x: 150, y: 50, geometry: { shape: "circle", d: 50 } },
        "D2": { x: 250, y: 50, geometry: { shape: "circle", d: 50 } },

        "Ra": { x: 350, y: 50, geometry: { shape: "square", d: 40 } },
        "EGP": { x: 350, y: 150, geometry: { shape: "square", d: 40 } },

        "G": { x: 500, y: 50, geometry: { shape: "square", d: 40, doubleLine: 1 }, class: "output" },
    },

    connections: [
        { type: "arrow", from: { id: "Q1", angle: -30 }, to: { id: "Q2", angle: -150 }, id: "Q1Q2" },
        { type: "arrow", from: { id: "Q2", angle: 150 }, to: { id: "Q1", angle: 30 }, label: { text: "k12" } },
        { type: "arrow", from: { id: "Q2" }, to: { x: 675, y: 150 }, id: "Q2away", label: { text: "" } },
        { type: "arrow", from: { id: "x1" }, to: { id: "Q1Q2" }, label: { text: "" }, style: "stroke-dasharray: 5 5" },
        { type: "arrow", from: { id: "x2" }, to: { id: "Q2away", angle: -90 }, label: { text: "" }, style: "stroke-dasharray: 5 5" },
        { type: "arrow", from: { id: "S1" }, to: { id: "S2" }, label: { text: "tmaxI" } },
        { type: "arrow", from: { id: "S2" }, to: { id: "I" }, label: { text: "tmaxI" } },
        { type: "arrow", from: { id: "I" }, to: { x: 385, y: 385 }, label: { text: "ke" } },
        { type: "arrow", from: { id: "I", angle: 20 }, to: { id: "x3", angle: -110 }, label: { text: "SIE" } },
        { type: "arrow", from: { id: "I", angle: 10 }, to: { id: "x1", angle: -120 }, label: { text: "SIT" } },
        { type: "arrow", from: { id: "I", angle: 0 }, to: { id: "x2", angle: -135 }, label: { text: "SID" } },
        { type: "arrow", from: { id: "x3" }, to: { x: 485, y: 285 }, label: { text: "ka3" } },
        { type: "arrow", from: { id: "x1" }, to: { x: 585, y: 285 }, label: { text: "ka1" } },
        { type: "arrow", from: { id: "x2" }, to: { x: 685, y: 285 }, label: { text: "ka2" } },
        { type: "arrow", from: { id: "D1" }, to: { id: "D2" }, label: { text: "tmaxG" } },
        { type: "arrow", from: { id: "D2" }, to: { id: "Ra" }, label: { text: "tmaxG" } },
        { type: "arrow", from: { id: "D2" }, to: { x: 285, y: 85 }, label: { text: "tmaxG" } },
        { type: "arrow", from: { id: "Ra", angle: 0 }, to: { id: "Q1", angle: 120 }, },
        { type: "arrow", from: { id: "x3", angle: 105 }, to: { id: "EGP", angle: -15 }, style: "stroke-dasharray: 5 5" },
        { type: "arrow", from: { id: "EGP" }, to: { id: "Q1" }, },
        { type: "arrow", from: { x: 250, y: 150 }, to: { id: "EGP" }, label: { text: "EGP0" } },
        { from: { id: "Q1" }, to: { id: "G" } },
    ],

    inputs: {
        "CHO": { to: { id: "D1", angle: 0 } },
        "IIR": { to: { id: "S1", angle: 0 } },
    },

}
