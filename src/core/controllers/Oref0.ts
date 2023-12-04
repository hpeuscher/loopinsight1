/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import tempBasalFunctions from 'oref0/lib/basal-set-temp.js'
import determine_basal from 'oref0/lib/determine-basal/determine-basal.js'
import glucoseGetLast from 'oref0/lib/glucose-get-last.js'
import iob from 'oref0/lib/iob/index.js'
import getMealData from 'oref0/lib/meal/total.js'
import Oref0ConsoleLogger from '../../common/Oref0ConsoleLogger.js'
import Controller, {
    AnnouncementList,
    ControllerInternals,
    ControllerOutput,
    Measurement,
    TracedMeasurement
} from '../../types/Controller.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import { TypedParameterValues } from '../../types/ParametricModule.js'
import { PatientProfile } from '../../types/Patient.js'
import AbstractController from '../AbstractController.js'
import EventManager from '../EventManager.js'

export const profile: ModuleProfile = {
    type: "controller",
    id: "Oref0",
    version: "2.0.0",
    name: "OpenAPS",
}


export type TreatmentRecord = {
    _type: string,
    timestamp: string | Date,
    rate?: number,
    eventType?: string,
    carbs?: number,
    nsCarbs?: number,
    amount?: number,
    insulin?: number,
    date?: Date | number,
    dateString?: string,
    started_at?: Date
}

export type TempRate = {
    deliverAt?: Date,
    duration?: number,
    rate?: number,
    temp?: string
}

export type GlucoseRecord = {
    glucose: number,
    date?: Date,
    dateString?: string,
}


export const Oref0Parameters =
{
    /** default basal rate in U/h */
    current_basal: { unit: 'U/h', default: 0.7 },
    sens: { unit: '(mg/dl)/U', default: 50, increment: 5 },
    dia: { unit: 'h', default: 6 },
    carb_ratio: { unit: 'g/U', default: 8 },
    max_iob: { unit: 'U', default: 3.5 },
    max_basal: { unit: 'U/h', default: 3.5 },
    max_daily_basal: { unit: 'U', default: 2 },
    max_bg: { unit: 'mg/dl', default: 120 },
    min_bg: { unit: 'mg/dl', default: 120 },
    maxCOB: { unit: 'g', default: 120 },
}

/** Full oref0 profile contains some more parameters */
export type Oref0Profile = Partial<TypedParameterValues<typeof Oref0Parameters, {}> & {
    type: "current",
    min_5m_carbimpact: number,
    isfProfile: ISFProfile
}>

declare type ISFProfile = {
    sensitivities: SensitivityList[]
}

declare type SensitivityList = {
    offset: number,
    sensitivity: number
}


export default class Oref0
    extends AbstractController<typeof Oref0Parameters>
    implements Controller {

    /** patient profile */
    profile!: Oref0Profile
    /** current temp adjustment of basal rate */
    currenttemp: TempRate = {}
    /** history of events (meals, temps, ...) */
    treatmentHistory: TreatmentRecord[] = []
    /** history of measurements */
    glucoseHistory: GlucoseRecord[] = []
    /** current basal rate output */
    IIR = 0
    /** helper to manage announcements */
    mealManager: EventManager = new EventManager()
    /** helper to pipe console output of oref0 to buffer and access it */
    customLogger = new Oref0ConsoleLogger()


    getParameterDescription() {
        return Oref0Parameters
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
        return ["iir"]
    }

    autoConfigure?(profile: PatientProfile) {
        const IIReq = profile?.IIReq
        if (typeof IIReq !== "undefined") {
            this.setParameterValues({ current_basal: Math.round(IIReq * 20) / 20 })
        }
    }

    override reset(t: Date) {
        super.reset(t)

        this.profile = { ...this.getParameterValues() }
        this.profile.type = "current"
        this.profile.min_5m_carbimpact = 12
        this.profile.isfProfile = {
            sensitivities: [
                { offset: 0, sensitivity: 100 } // TODO
            ]
        }

        this.internals = {}
        this.customLogger.clear()
        this.currenttemp = {}
        this.treatmentHistory = []
        this.glucoseHistory = []

        // this.mealBolus.reset(t)
        this.mealManager.reset()

        // reset medication
        this.IIR = this.getParameterValues().current_basal
    }


    update(t: Date,
        s: TracedMeasurement,
        announcements: AnnouncementList = {},
        m: ControllerOutput = {}) {

        this.internals = {}
        this.output = {}

        const ibolus = m.ibolus
        if (ibolus) {
            this.treatmentHistory.push({
                _type: "Bolus",
                timestamp: t.toISOString(),
                amount: ibolus,
                insulin: ibolus,
                date: t,
                dateString: t.toISOString(),
                started_at: t,
            })
        }

        // announced meals for time since last call
        const meal = this.mealManager.update(announcements,
            (uid) => announcements[uid].start <= t)
            .reduce((cum, id) => cum + announcements[id].carbs, 0)

        if (meal > 0) {
            this.treatmentHistory.push({
                _type: "carbs",
                timestamp: t.toISOString(),
                carbs: meal,
                nsCarbs: meal,
            })
        }

        // run only every 5 minutes
        if (t.getMinutes() % 5) {
            return {}
        }
        const G = s.CGM?.()

        if (typeof G !== "undefined") {
            // add current glucose measurement to history
            this.glucoseHistory.unshift({
                date: t,
                dateString: t.toISOString(),
                glucose: G
            })
        }
        if (this.glucoseHistory.length === 0) {
            // no measurements available yet
            return {}
        }

        // add effect of current temp (5min) to treatment history (->IOB)
        // TODO remove obsolete entries from treatmentHistory for efficiency?
        this.treatmentHistory.push({
            _type: "Temp Basal",
            eventType: "Temp Basal",
            rate: this.IIR - this.getParameterValues().current_basal,
            date: t.valueOf() - 5 * 60 * 1000,
            timestamp: new Date(t.valueOf() - 5 * 60 * 1000),
            insulin: 5 / 60 * (this.IIR - this.getParameterValues().current_basal), // TODO : add duration
        })

        // compute glucose trends
        let glucose_status = glucoseGetLast(this.glucoseHistory)

        // redirect console outputs to capture them
        this.customLogger.clear()
        if (typeof process.stderr === "undefined") {
            process.stderr = [] as any
        }
        process.stderr.write = <any>this.customLogger.write
        console.error = this.customLogger.write

        // configure autosens
        const autosens = { ratio: 1.0 }	// TODO -> separate task, every xx minutes, see autosense.js

        // compute IOB based on temp and bolus history
        const iob_data = iob(
            {
                profile: this.profile,
                clock: t,
            },
            false,
            this.treatmentHistory,
        )


        // compute meal data
        const opts = {
            treatments: this.treatmentHistory,
            profile: this.profile,
            pumphistory: this.treatmentHistory,		// -> total.js / iob_inputs
            glucose: this.glucoseHistory,
            basalprofile: {
                basals: [
                    { minutes: 0, rate: 1 }	// todo: for time-variant patient physiology, define profile of basal rate over the day
                ]
            }
        }

        const meal_data = getMealData(opts, t)	// -> total.js

        // TODO: not sure why this is necessary; value seems to be overwritten??
        this.profile.current_basal = this.getParameterValues().current_basal


        // check if current temp is still active
        const tempEnd = this.currenttemp?.deliverAt?.valueOf?.() || 0
            + (this.currenttemp?.duration || 0) * 60e3
        if (tempEnd < t?.valueOf()) {
            // otherwise, return to default
            this.currenttemp = {}
        }

        // call determine-basal
        const basal = determine_basal(glucose_status,
            this.currenttemp,
            iob_data,
            this.profile,
            autosens,
            meal_data,
            tempBasalFunctions,
            false,
            undefined,
            t)



        // prepare outputs
        if (typeof basal.rate !== 'undefined' && !isNaN(basal.rate)) {
            // remember new temp
            this.currenttemp = {
                duration: basal.duration,
                deliverAt: basal.deliverAt,
                rate: basal.rate,
                temp: "absolute"
            }

            this.IIR = basal.rate
        }

        // extract log information
        this.internals = this.extractLogData(t, basal)

        this.output = { iir: this.IIR }
    }


    /**
     * construct controller log from oref0 output
     * 
     * @param {Date} t - time
     * @param {Measurement} s - sensor output
     * @param {AnnouncementList} announcements - sensor output
     * @returns {ControllerOutput} controller output
     */

    protected extractLogData(t: Date, basal: any): ControllerInternals {

        let logData: ControllerInternals = {}
        //const logData = { ...basal }
        logData.debug = this.customLogger.messages.slice(0) // shallow copy
        try {
            logData.reason = (basal.reason as string).split(/[,;]/).map(s => s.trim())
        } catch {
            logData.reason = [""]
        }

        // store bg prediction for interactive visualization
        let predBG = []
        if (typeof basal.predBGs !== "undefined") {
            if (typeof basal.predBGs.COB !== "undefined") {
                // if prediction based on COB is available, use it
                predBG = basal.predBGs.COB
            }
            else if (typeof basal.predBGs.IOB !== "undefined") {
                // otherwise, use prediction based on IOB
                predBG = basal.predBGs.IOB
            }
        }

        // predicted blood glucose levels
        logData.predictedBG = []
        for (let i = 0; i < predBG.length; i++) {
            logData.predictedBG.push({
                t: new Date(t.valueOf() + 5 * 60000 * i),
                Gp: predBG[i]
            })
        }

        return logData
    }
}




export const i18n_label = {
    en: {
        "name": "OpenAPS (oref0)",
        "current_basal": "default basal rate",
        "sens": "Insulin sensitivity factor (ISF)",
        "min_bg": "minimum BG target",
        "max_bg": "maximum BG target",
        "dia": "duration of insulin activity (DIA)",
        "carb_ratio": "carb ratio (CR)",
        "max_iob": "maximum IOB",
        "max_basal": "maximum basal",
    },

    de: {
        "name": "OpenAPS (oref0)",
        "sens": "Insulin sensitivity factor (ISF)",
        "current_basal": "Standardbasalrate",
        "min_bg": "Untergrenze Zielwert Glukose",
        "max_bg": "Obergrenze Zielwert Glukose",
        "dia": "Duration of Insulin Activity (DIA)",
        "carb_ratio": "Carb Ratio (CR)",
        "max_iob": "Maximalwert IOB",
        "max_basal": "Maximale Basalrate",
    },
}


export const i18n_tooltip = {
    en: {
        "sens": "The ISF is used to predict the eventual blood glucose concentration after all remaining insulin on board has taken its effect.",
        "min_bg": "The algorithm tries to keep blood glucose above this value.",
        "max_bg": "The algorithm tries to keep blood glucose below this value.",
        "dia": "DIA describes how long it takes before insulin that is delivered now has completely taken effect.",
        "carb_ratio": "CR is the quotient of carbs and the compensating amount of insulin.",
        "max_iob": "The computed amount of insulin on board (IOB) is capped at this maximum.",
        "max_basal": "The basal rate is capped at this maximum.",
    },

    de: {
        "sens": "Der ISF dient zur Vorhersage des finalen Glukosespiegels, sobald alles verbleibende Insulin (IOB) seine Wirkung entfaltet hat.",
        "min_bg": "Der Algorithmus versucht den Glukosespiegel über diesem Wert zu halten.",
        "max_bg": "Der Algorithmus versucht den Glukosespiegel unter diesem Wert zu halten.",
        "dia": "DIA beschreibt, wie lange es dauert, über welchen Zeitraum Insulin, das jetzt abgegeben wird, seine Wirkung entfaltet und abgebaut wird.",
        "carb_ratio": "CR is das Verhältnis zwischen Kohlenhydraten und der ausgleichenden Insulinmenge.",
        "max_iob": "Das berechnete im Körper befindliche Insulin (IOB) wird bei diesem Maximum abgeschnitten.",
        "max_basal": "Die Basalrate wird bei diesem Maximum abgeschnitten.",
    },
}

