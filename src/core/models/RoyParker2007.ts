/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { ModuleProfile } from '../../types/ModuleProfile.js'
import ODEPatientModel from '../../types/ODEPatientModel.js'
import { ParameterDescriptions } from '../../types/ParametricModule.js'
import {
    TypedPatientState, PatientInput, PatientOutput,
    StateDescription
} from '../../types/Patient.js'
import AbstractODEPatient, { createPatientFromODE } from '../AbstractODEPatient.js'

export const profile: ModuleProfile = {
    type: "patient",
    id: "RoyParker2007",
    version: "2.1.0",
    name: "Roy/Parker 2007",
}

/**
 * Class representing virtual patient according to Roy/Parker (2007).
 * 
 * Scientific sources:
 * 
 * [Roy; Parker, JDST, 2007]
 *     Roy, A.; Parker, R.S.
 *     "Dynamic Modeling of Exercise Effects on Plasma Glucose and Insulin Levels"
 *     Journal of Diabetes Science and Technology, Volume 1, Issue 3, 2007
 * 
 * [Roy; Parker, IEEE, 2006]
 *     Roy, A.; Parker, R.S.
 *     "Mixed Meal Modeling and Disturbance Rejection in Type I Diabetic Patients"
 *     IEEE, 2006
 * 
 */
export class RoyParker2007
    extends AbstractODEPatient
        <typeof stateDescription, typeof parameterDescription> 
    implements ODEPatientModel<State> {

    /** insulin concentration in equilibrium */
    Ib: number = NaN

    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array<keyof PatientInput> {
        return ["meal", "iir", "exercise"]
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

    computeSteadyState(u: PatientInput, t: Date): State {
        const params = this.evaluateParameterValuesAt(t)

        this.Ib = (params.u1b * 1e6 * params.p4) / (60 * params.n) // TODO U/h to µU/ml ***??
        return {
            "I": this.Ib,
            "G": params.Gpeq,
            "X": 0,
            "Ie": 0,
            "Gprod": 0,
            "Gup": 0,
            "Ggly": 0,
            "PVO2_max": 0,
            "A": 0,
            "NG": 0,
            "CurrentMealStart": Infinity,
            "CurrentMealCarbs": 0
        }
    }

    updateDiscontinuousStates(t: Date, x: State, u: PatientInput) : State {
        /** exercise intensity */
        const u3 = (u.exercise || 0)
        if (u3 === 0) {
            // reset A after exercise unit
            x.A = 0
        }

        /** meal */
        const meal = u.meal || 0
        if (meal > 0 && isFinite(meal)) {
            x.CurrentMealCarbs = meal
            x.CurrentMealStart = t.valueOf()
        }

        return x
    }

    computeDerivatives(t: Date, x: State, u: PatientInput): State {

        const params = this.evaluateParameterValuesAt(t)

        // inputs
        /** insulin infusion rate in µU/min */
        const u1 = (u.iir || 0) * 1e6 / 60
        /** total nutrients consumed in mg/min */
        const u2 = params.kG * x.NG * 1000
        /** exercise intensity in % */
        const u3 = u.exercise || 0

        // calculations for meal model [Roy; Parker, IEEE, 2006]
        /** total nutrients (here: glucose) consumed in g */
        const Ntot = x.CurrentMealCarbs
        /** time since current meal started in min */
        const tMeal = (t.valueOf() - x.CurrentMealStart) / 60e3 || 0

        /** maximum rate of gastric emptying in g/min */
        const Vmax = 2 * Ntot / (params.Tasc + 2 * params.Tmax + params.Tdes)
        /** rate of gastric emptying in g/min */
        let Gemp = 0

        if (tMeal > 0 && tMeal < params.Tasc) {
            Gemp = Vmax * tMeal / params.Tasc
        }
        else if (tMeal <= params.Tasc + params.Tmax) {
            Gemp = Vmax
        }
        else if (tMeal <= params.Tmax + params.Tasc + params.Tdes) {
            Gemp = Vmax - Vmax / params.Tdes *
                (tMeal - params.Tasc - params.Tmax)
        }

        // calculations for exercise model [Roy; Parker, JDST, 2007]
        /** threshold value ATH at which rate of glycogenolysis (Ggly) starts
         *  to decrease, eq. (13) */
        const ATH = -1.1521 * Math.pow(u3, 2) + 87.471 * u3

        // return vector of derivatives dx/dt
        return {
            // calculations for meal model
            /** amount of glucose (here, 100% of meal is glucose) */
            NG: 1 * Gemp - params.kG * x.NG,

            // calculations for exercise model
            /** PVO2_max, eq. (4) */
            PVO2_max: -0.8 * x.PVO2_max + 0.8 * u3,

            /** I(t) insulin dynamics in µU/ml, eq. (5)  */
            I: -params.n * x.I + params.p4 * u1 - x.Ie,

            /** X(t) in 1/min, eq. (6) */
            X: -params.p2 * x.X + params.p3 * (x.I - this.Ib),

            /** plasma glucose in mg/dl, eq. (7) */
            G: -params.p1 * (x.G - params.Gpeq) - x.X * x.G
                + params.BW / params.VolG * (x.Gprod - x.Ggly - x.Gup)
                + u2 / params.VolG,

            /** hepatic glucose production due to exercise in mg/kg/min, eq. (8) */
            Gprod: params.a1 * x.PVO2_max - params.a2 * x.Gprod,

            /** glucose uptake rate due to exercise in mg/kg/min, eq. (9) */
            Gup: params.a3 * x.PVO2_max - params.a4 * x.Gup,

            /** rate of insulin removal Ie in µU/ml/min, eq. (10) */
            Ie: params.a5 * x.PVO2_max - params.a6 * x.Ie,

            /** integrated exercise A(t) --> needed for calculation of Ggly, eq. (15) */
            A: u3,

            /** decline of glycogenolysis rate due to prolonged exercise 
             *  in mg/kg/min, eq. (A14) */
            Ggly: (u3 === 0) ?
                // after exercise, decay at time constant T1
                -x.Ggly / params.T1 :
                // during exercise, check if A is above threshold
                (x.A >= ATH) ?
                    // if so, increase at rate k 
                    params.k :
                    // otherwise, do not increase further
                    0,
            
            CurrentMealCarbs: 0,
            CurrentMealStart: 0,
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
    /** basal rate in equilibrium / homeostasis */
    "u1b":  { unit: "U/h", default: 1 },
    "a1":   { unit: "", default: 0.00158 },		// [Roy; Parker, JDST, 2007]
    "a2":   { unit: "", default: 0.056 }, 		// [Roy; Parker, JDST, 2007]
    "a3":   { unit: "", default: 0.00195 },		// [Roy; Parker, JDST, 2007]
    "a4":   { unit: "", default: 0.0485 },		// [Roy; Parker, JDST, 2007]
    "a5":   { unit: "", default: 0.00125 },		// [Roy; Parker, JDST, 2007]
    "a6":   { unit: "", default: 0.075 },		// [Roy; Parker, JDST, 2007]
    "k":    { unit: "", default: 0.0108 },		// [Roy; Parker, JDST, 2007]
    "T1":   { unit: "", default: 6 },			// [Roy; Parker, JDST, 2007]
    "VolG": { unit: "", default: 117 },			// [Roy; Parker, JDST, 2007]
    "p1":   { unit: "", default: 0.035 },		// [Roy; Parker, JDST, 2007]
    "p2":   { unit: "", default: 0.05 },		// [Roy; Parker, JDST, 2007]
    "p3":   { unit: "", default: 0.000028 },	// [Roy; Parker, JDST, 2007]
    "p4":   { unit: "", default: 0.098e-3 },	// [Roy; Parker, JDST, 2007]
    "n":    { unit: "", default: 0.142 },		// [Roy; Parker, JDST, 2007]
    "Tasc": { unit: "", default: 10 },			// [Roy; Parker, IEEE, 2006]
    "Tdes": { unit: "", default: 10 },			// [Roy; Parker, IEEE, 2006]
    "Tmax": { unit: "", default: 35 },			// [Roy; Parker, IEEE, 2006]
    "kG":   { unit: "", default: 0.022 },		// [Roy; Parker, IEEE, 2006]
    "kP":   { unit: "", default: 0.0097 },		// [Roy; Parker, IEEE, 2006]
    "kF":   { unit: "", default: 0.015 },		// [Roy; Parker, IEEE, 2006]
} satisfies ParameterDescriptions

/** Description of state variables. */
const stateDescription = {
    /** insulin dynamics in µU/ml */
    I: { unit: "µU/ml" },
    /** plasma glucose in mg/dl */
    G: { unit: "mg/dl" },
    /** X(t) in 1/min */
    X: { unit: "1/min" },
    /** rate of insulin removal Ie in µU/ml/min */
    Ie: { unit: "µU/ml/min" },
    /** hepatic glucose production due to exercise in mg/kg/min */
    Gprod: { unit: "mg/kg/min" },
    /** glucose uptake rate due to exercise in mg/kg/min */
    Gup: { unit: "mg/kg/min" },
    /** decline of glycogenolysis rate due to prolonged exercise in mg/kg/min */
    Ggly: { unit: "mg/kg/min" },
    /** PVO2_max in % */
    PVO2_max: { unit: "%" },
    /** integrated exercise A(t) --> needed for calculation of Ggly */
    A: { unit: "", discontinuous: true},
    /** amount of glucose in g (here, 100% of meal is glucose) */
    NG: { unit: "g" },
    /** time when current meal started */
    CurrentMealStart: {unit: "", discontinuous: true},
    /** total amount of current meal */
    CurrentMealCarbs: {unit: "", discontinuous: true},
} satisfies StateDescription

/** Type for patient state, i.e. numeric values of the state variables. */
type State = TypedPatientState<typeof stateDescription>

/** Use mixin to create Patient from ODEPatientModel. */
export default createPatientFromODE
    <typeof stateDescription, typeof parameterDescription>
    (RoyParker2007)
