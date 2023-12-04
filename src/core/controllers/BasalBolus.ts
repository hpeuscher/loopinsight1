/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import Controller from '../../types/Controller.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import { TypedParameterValues } from '../../types/ParametricModule.js'
import { CommonControllerParametersDescription } from '../AbstractController.js'
import ControllerUnion from '../ControllerUnion.js'
import CSII, {
    CSIIParameters,
    i18n_label as CSII_label,
    i18n_tooltip as CSII_tooltip
} from './CSII.js'
import MealBolusWithCorrection, {
    MealBolusWithCorrectionParameters,
    i18n_label as MealBolus_label,
    i18n_tooltip as MealBolus_tooltip
} from './MealBolusWithCorrection.js'


export const profile: ModuleProfile = {
    type: "controller",
    id: "BasalBolus",
    version: "2.0.0",
    name: "BasalBolus",
}

export default class BasalBolus
    extends ControllerUnion
    implements Controller {

    constructor(parameters: Partial<TypedParameterValues<
        BasalBolusParameters,
        typeof CommonControllerParametersDescription>
    > = {}) {
        super([
            new CSII(),
            new MealBolusWithCorrection()
        ])
        this.setParameterValues(parameters)
    }

    getModelInfo(): ModuleProfile {
        return profile
    }
}

export declare type BasalBolusParameters =
    typeof CSIIParameters & typeof MealBolusWithCorrectionParameters

export const i18n_label = {
    ...CSII_label,
    ...MealBolus_label,
}

export const i18n_tooltip = {
    ...CSII_tooltip,
    ...MealBolus_tooltip,
}