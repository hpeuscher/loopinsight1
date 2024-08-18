/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import Controller, {
    AnnouncementList,
    ControllerOutput,
    Measurement,
    TracedMeasurement
} from '../../types/Controller.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import AbstractController from '../AbstractController.js'

export const profile: ModuleProfile = {
    type: "controller",
    id: "CorrectionBolus",
    version: "2.0.0",
    name: "Meal bolus with correction",
}

/**
 * Class representing a controller that corrects a bolus (as demanded by another 
 * controller) accounting for current BG levels with a correction factor.
 * Use it together with e.g. MealBolus as part of a ControllerUnion.
 */
export default class CorrectionBolus
    extends AbstractController<typeof CorrectionBolusParameters>
    implements Controller {

    getParameterDescription() {
        return CorrectionBolusParameters
    }

    getI18n() {
        return { i18n_label, i18n_tooltip }
    }

    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array<keyof Measurement> {
        return ["CGM"]
    }

    getOutputList(): Array<keyof ControllerOutput> {
        return ["ibolus"]
    }

    update(_t: Date,
        s: TracedMeasurement, 
        _a?: AnnouncementList, 
        m: ControllerOutput = {}): void {
        
        // reset previous log output
        this.internals = {}
        this.output = {}

        // check if bolus is demanded by another controller (e.g., meal bolus)
        if ((m.ibolus ?? 0) > 0) {
            const params = this.getParameterValues()
            // correct its value using current BG measurement
            /** actual blood glucose in mg/dl */
            const actualBG = Math.round(s.CGM?.() || s.SMBG?.() || NaN)
            console.assert(!isNaN(actualBG), "BG = " + actualBG + " at " + _t.toLocaleTimeString())
            /** error between desired and actual BG in mg/dl */
            const BGerror = Math.round(actualBG - params.targetBG)
            /** correction bolus */
            const icorrbolus = (BGerror) / params.correctionFactor

            // amend controller log
            let reason: string[] = []
            reason.push("")
            reason.push("correction bolus:")
            reason.push("-> current BG = " + actualBG + " mg/dl")
            reason.push("-> target = " + params.targetBG + " mg/dl")
            reason.push("-> correction bolus = " + (BGerror)
                + " mg/dl / (" + params.correctionFactor + " mg/dl/U) = " + icorrbolus + " U")
            reason.push("")
            reason.push("total bolus: " + round(m.ibolus!+icorrbolus))
            this.internals = { reason }

            this.output = { ibolus: icorrbolus }
        }
    }
}

function round(bolus: number, increment = 0.01) {
    return Math.round(bolus / increment) * increment
}

export const CorrectionBolusParameters = {
    /** meal correction factor in mg/dl */
    correctionFactor: { unit: '(mg/dl)/U', min: 5, default: 50 },
    /** target blood glucose value in mg/gl */
    targetBG: { unit: 'mg/dl', default: 100, min: 50, increment: 5 },
}


export const i18n_label = {
    en: {
        "name": "PID controller + bolus",
        "correctionFactor": "correction factor",
        "targetBG": "target blood glucose",
    },

    de: {
        "name": "PID-Regler + Bolus",
        "correctionFactor": "Korrekturfaktor",
        "targetBG": "Zielwert Glukose",
    }
}

export const i18n_tooltip = {
    en: {
        "correctionFactor": "",
        "targetBG": "",
    },

    de: {
        "correctionFactor": "Der Korrekturfaktor (KF) dient zur Berechnung eines Korrekturbolus. Hierfür wird zunächst die Differenz zwischen aktueller und gewünschter Blutzuckerkonzentration ermittelt (in mg/dl) und diese Abweichung anschließend durch den KF geteilt. Ein größerer KF bewirkt somit einen kleineren Bolus.",
        "targetBG": "Die gewünschte Blutzuckerkonzentration beeinflusst die Höhe des Korrekturbolus.",
    }
}
