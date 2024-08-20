/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */


import DailyProfile, { InterpolationMethod } from '../../common/DailyProfile.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import ODEPatientModel from '../../types/ODEPatientModel.js'
import { ParameterDescriptions } from '../../types/ParametricModule.js'
import { PatientInput, PatientOutput } from '../../types/Patient.js'
import { createPatientFromODE } from '../AbstractODEPatient.js'
import {
    State,
    UvaPadova_T1DMS,
    parameterDescription as parameterDescriptionT1DMS,
    stateDescription
} from './UvaPadova_T1DMS.js'

export const profile: ModuleProfile = {
    type: "patient",
    id: "UvaPadova_Visentin2015",
    version: "2.1.0",
    name: "UVA/Padova (Visentin 2015)",
    extends: "UvaPadova_T1DMS"
}

/**
 * Class representing virtual patient according to the UVA/Padova model as 
 * implemented in the Type 1 Diabetes Metabolic Simulator (T1DMS). TODO
 * 
 * Scientific sources:
 * 
 * [Visentin, 2015]
 * Visentin, Roberto et al.
 * "Circadian Variability of Insulin Sensitivity: Physiological Input for
 *  In Silico Artificial Pancreas"
 * Diabetes Technology & Therapeutics, Vol 17, No 1, 2015
 * 
 * [Visentin, 2018]
 * Visentin, Roberto et al.
 * "The UVA/Padova Type 1 Diabetes Simulator Goes From Single Meal to Single Day"
 * Journal of Diabetes Science and Technology, Vol. 12(2), 2018
 * 
 */

export class UvaPadova_Visentin2015
    extends UvaPadova_T1DMS
    implements ODEPatientModel<State> {

    getModelInfo(): ModuleProfile {
        return profile
    }

    getParameterDescription(): any {
        return parameterDescription
    }

    /**
     * insulin-dependent glucose utilization in mg/kg/min
     * [Visentin 2018] (A10)
     */
    Uid(t: Date, x: State, u: PatientInput): number {
        const params: any = this.evaluateParameterValuesAt(t)
        return params.kir * super.Uid(t, x, u)
    }

    computeOutput(t: Date, x: State): PatientOutput {
        const params = this.evaluateParameterValuesAt(t)
        return {
            Gp: x.Gp / params.VG,
            Gt: x.Gs / params.VG,
            Uid: this.Uid(t, x, {}),
        }
    }

}


/** Description of parameters. */
export const parameterDescription = {
    ...parameterDescriptionT1DMS,
    /**
     * insulin sensitivity modulation, [Visentin, 2018]
     */
    kir: {
        unit: "1", default: new DailyProfile(
            [[0, 1], [4, 0.8], [11, 0.9], [17, 1]],
            InterpolationMethod.SMOOTHSTEP, 2)
    },

    // TODO: kp1, kp3, Vmx?

} satisfies ParameterDescriptions


/** Use mixin to create Patient from ODEPatientModel. */
export default createPatientFromODE
    <typeof stateDescription, typeof parameterDescription>
    (UvaPadova_Visentin2015)
