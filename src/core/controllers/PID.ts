/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { isMultipleOfSamplingTime } from '../../common/DateUtility.js'
import Controller, {
    ControllerOutput,
    Measurement,
    TracedMeasurement
} from '../../types/Controller.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import { PatientProfile } from '../../types/Patient.js'
import AbstractController from '../AbstractController.js'

export const profile: ModuleProfile = {
    type: "controller",
    id: "PID",
    version: "2.1.0",
    name: "PID",
}

export default class PID
    extends AbstractController<typeof PIDParameters>
    implements Controller {

    /** time of last update */
    protected _tLast!: Date
    /** integral of blood glucose error in mg/dl*min */
    protected _eIntegral!: number
    /** previous blood glucose error (for computation of derivative) in mg/dl */
    protected _eOld!: number

    getParameterDescription() {
        return PIDParameters
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

    override reset(t: Date) {
        super.reset(t)
        this.output = { iir: this.evaluateParameterValuesAt(t).basalRate }
        this._tLast = t
        this._eIntegral = 0
        this._eOld = NaN
    }

    autoConfigure?(profile: PatientProfile) {
        const IIReq = profile?.IIReq
        if (typeof IIReq !== "undefined") {
            this.setParameterValues({ basalRate: Math.round(IIReq * 20) / 20 })
        }
    }

    update(t: Date, s: TracedMeasurement) {
        /** parameters */
        const params = this.evaluateParameterValuesAt(t)
        // sampling
        if (isMultipleOfSamplingTime(t, params.samplingTime)) {
            /** time since last call in min */
            const dt = (t.valueOf() - this._tLast.valueOf()) / 60e3
            // memorize time of update
            this._tLast = t

            // PID law
            /** measured glucose concentration in mg/dl */
            const G = s.CGM?.() || NaN
            console.assert(!isNaN(G))
            /** control error (desired - actual value) */
            const e = params.targetBG - G
            // update integral
            this._eIntegral += e / 60 * dt

            // evaluate control law
            let iir = params.basalRate
                - params.kP / 100 * e
                - params.kI / 100 * this._eIntegral
            if (!isNaN(this._eOld) && dt > 0) {
                /** rate of change */
                const de_dt = (e - this._eOld) * 60 / dt
                // add differential component
                iir -= params.kD / 100 * de_dt
            }
            this._eOld = e

            this.output = { iir }
        }

        return {}
    }
}


export const PIDParameters = {
    /** target blood glucose in mg/dl */
    targetBG: { unit: 'mg/dl', default: 120 },
    /** default basal rate in U/h */
    basalRate: { unit: 'U/h', default: 1, min: 0, increment: 0.1 },
    /** gain of proportional controller in U/h / (100 mg/dl) */
    kP: { unit: 'U/h / (100 mg/dl)', default: 0.5, min: 0, increment: 0.1 },
    /** gain of integral controller in U/h / (100 mg/dl) / h */
    kI: { unit: 'U/h / (100 mg/dl) / h', default: 0.01, min: 0, increment: 0.01 },
    /** gain of derivative controller in U/h / (100 mg/dl) * h */
    kD: { unit: 'U/h / (100 mg/dl) * h', default: 0, min: 0, increment: 0.01 },
    /** sampling time in minutes */
    samplingTime: { unit: "min", default: 5, min: 1, step: 1 },
}


export const i18n_label = {
    en: {
        "name": "PID controller + bolus",
        "basalRate": "default basal rate",
        "kP": "proportional gain",
        "kI": "integral gain",
        "kD": "differential gain",
        "targetBG": "target glucose concentration",
        "samplingTime": "Sampling time",
    },

    de: {
        "name": "PID-Regler + Bolus",
        "basalRate": "Standardbasalrate",
        "kP": "Proportional-Faktor",
        "kI": "Integral-Faktor",
        "kD": "Differential-Faktor",
        "targetBG": "Ziel-Konzentration",
        "samplingTime": "Abtastzeit",
    }
}

export const i18n_tooltip = {
    en: {
    },

    de: {
    }
}
