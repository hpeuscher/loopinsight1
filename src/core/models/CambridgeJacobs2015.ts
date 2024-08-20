/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { ModuleProfile } from '../../types/ModuleProfile.js'
import {
    PatientInput,
    TypedPatientState
} from '../../types/Patient.js'
import { createPatientFromODE } from '../AbstractODEPatient.js'
import {
    Cambridge,
    parameterDescription as parameterDescriptionCambridge,
    stateDescription as stateDescriptionCambridge,
} from './Cambridge.js'

export const profile: ModuleProfile = {
    type: "patient",
    id: "CambridgeJacobs2015",
    version: "2.1.0",
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
    extends Cambridge {

    getModelInfo(): ModuleProfile {
        return profile
    }

    getParameterDescription(): any {
        return parameterDescription
    }

    computeSteadyState(u: PatientInput, t: Date): State {

        return {
            ... super.computeSteadyState(u, t),
            "ΓPGUA": -10.1958,	// glucose uptake due to exercise
            "ΓHGPA": -10.1958,	// glucose production due to exercise
            "PVO2max": 0,		// percentage of volumen of oxygen consumed
        }
    }

    computeDerivatives(t: Date, x: State, u: PatientInput): State {

        const params: any = this.evaluateParameterValuesAt(t)

        /** exercise intensity */
        const intensity = (u.exercise || 0) / 100
        const PAMM = intensity

        const x_ = super.computeDerivatives(t, x, u)
        
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
        return { ...x_,

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

        }
    }

}


/** Description of parameters. */
export const parameterDescription = {
    ...parameterDescriptionCambridge,
    "PGUb": { unit: "mg/min", default: 35, }, // [Lenart; Parker 2002]
    "HGPb": { unit: "mg/min", default: 155, }, // [Lenart; Parker 2002]
}

/** Description of state variables. */
export const stateDescription = {
    ...stateDescriptionCambridge,
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
