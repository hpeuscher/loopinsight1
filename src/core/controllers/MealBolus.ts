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
import { ParameterDescriptions } from '../../types/ParametricModule.js'
import AbstractController from '../AbstractController.js'
import EventManager from '../EventManager.js'

export const profile: ModuleProfile = {
    type: "controller",
    id: "MealBolus",
    version: "2.1.0",
    name: "Meal bolus",
}


/**
 * Controller that administers a meal bolus.
 */
export default class MealBolus
    extends AbstractController<typeof MealBolusParameters>
    implements Controller {

    /** helper to manage announcements */
    manager: EventManager = new EventManager()

    getParameterDescription() {
        return MealBolusParameters
    }

    getI18n() {
        return { i18n_label, i18n_tooltip }
    }

    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array<keyof Measurement> {
        return []
    }

    getOutputList(): Array<keyof ControllerOutput> {
        return ["ibolus"]
    }

    override reset(t: Date) {
        super.reset(t)
        this.manager.reset()
    }

    update(t: Date, _s: TracedMeasurement, announcements: AnnouncementList = {}) {

        const parameters = this.evaluateParameterValuesAt(t)

        // find announcements that are upcoming within premealTime and not yet handled
        const upcomingIDs = this.manager.update(announcements, (uid) => 
            announcements[uid].start <= new Date(t.valueOf()
                + parameters.premealTime * 60e3))

        // for upcoming announcements, cumulate bolus
        let ibolus = 0
        let reason: string[] = []
        for (const id of upcomingIDs) {
            reason.push("meal bolus:")
            ibolus += announcements[id].carbs * parameters.carbFactor / 10
            reason.push("-> announced meal: " + announcements[id].carbs + " g at "
                + announcements[id].start.toLocaleString())
            reason.push("-> carb factor: " + parameters.carbFactor + " U/(10g)")
            reason.push("-> meal bolus: " + announcements[id].carbs + " g * ("
                + parameters.carbFactor + " U/(10g) * 10) = " + ibolus + " U")
        }
        this.internals = { reason }

        this.output = { ibolus }
    }

}



export const MealBolusParameters = {
    /** carb factor in U/(10g CHO) */
    carbFactor: { unit: 'U/(10g CHO)', default: 1, min: 0, step: 0.1 },
    /** pre-bolus interval in min */
    premealTime: { unit: 'min', default: 30, step: 5 },
} satisfies ParameterDescriptions


export const i18n_label = {
    en: {
        "name": "PID controller + bolus",
        "carbFactor": "carb factor",
        "premealTime": "time between bolus and meal",
    },

    de: {
        "name": "PID-Regler + Bolus",
        "premealTime": "Spritz-Ess-Abstand",
        "carbFactor": "KE-Faktor",
    }
}


export const i18n_tooltip = {
    en: {
        // "useBolus": "Choose if the virtual patient manually administers a meal bolus.",
        "carbFactor": "The carb factor defines how much insulin is required to compensate for an amount of carbs.",
        "premealTime": "This defines how much before the meal a bolus is administered.",
    },

    de: {
        // "useBolus": "Legt fest, ob vom virtuellen Patienten ein manueller Mahlzeitenbolus abgegeben wird.",
        "carbFactor": "Der KE-Faktor beschreibt, wie viel Insulin benötigt wird, um eine Kohlenhydrateinheit (10g) auszugleichen.",
        "premealTime": "Der Spritz-Ess-Abstand legt fest, wie lange vor der Mahlzeit ein Bolus abgegeben wird.",
    },
}

