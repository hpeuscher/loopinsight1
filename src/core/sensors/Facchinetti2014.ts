/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/*
The CGM sensor model implemented in this file uses information from:

[Facchinetti, IEEE, 2014]
    Facchinetti, A.; Del Favero, S.; Sparacino, G.; Castle, J.R.; Ward, W.K.; Cobelli, C.:
    "Modeling the Glucose Sensor Error"
    IEEE Transactions on Biomedical Engineering, Volume 61, No. 3, 2014
    DOI: 10.1109/TBME.2013.2284023

*/

import { isMultipleOfSamplingTime, nextUpdateTime } from '../../common/DateUtility.js'
import RNG_Ziggurat_SHR3 from '../../common/random/RNG_Ziggurat_SHR3.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import Sensor, { Measurement, PatientOutput } from '../../types/Sensor.js'
import AbstractSensor from '../AbstractSensor.js'

export const profile: ModuleProfile = {
    type: "sensor",
    id: "Facchinetti2014",
    version: "2.1.0",
    name: "Dexcom SEVEN Plus (Facchinetti 2014)",
}


/** Class representing a CGM sensor as described by Facchinetti. */
export default class Facchinetti2014
    extends AbstractSensor<typeof Facchinetti2014Parameters> 
    implements Sensor {
    
    /** RNG for sensor noise */
    protected rng!: RNG_Ziggurat_SHR3
    /** state of AR model */
    protected v = [0, 0]
    /** state of "common component" AR model */
    protected cc = [0, 0]
    /** time of last calibration */
    protected tCalib!: Date

    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array<keyof PatientOutput> {
        return ["Gt"]
    }

    getOutputList(): Array<keyof Measurement> {
        return ["CGM"]
    }

    getParameterDescription() {
        return Facchinetti2014Parameters
    }

    override reset(t: Date, seed: number): void {
        super.reset(t, seed)

        this.rng = new RNG_Ziggurat_SHR3(seed)
        this.rng.reset()
        this.tCalib = t
        this.v = [0, 0]
        this.cc = [0, 0]
    }

    override getNextUpdateTime(t: Date) {
        // call every minute (to update sensor noise)
        return nextUpdateTime(t, 1)
    }

    update(t: Date, y: PatientOutput) {
        // update stochastic error (once a minute!)
        const noise = this._getNextNoise(t)
        /** sensor parameters */
        const params = this.evaluateParameterValuesAt(t)
        
        if (isMultipleOfSamplingTime(t, params.samplingTime)) {
            /** glucose concentration in interstitium */
            const IG: number = y.Gt || y.Gp || NaN  // TODO

            /** time since calibration in days */
            const dt = (t.valueOf() - this.tCalib.valueOf()) / MS_PER_DAY

            /** relative error and bias (deterministic dynamics) */
            const a = params.a0 + params.a1 * dt + params.a2 * dt * dt    // (5)
            const b = params.b0 + params.b1 * dt + params.b2 * dt * dt    // (6)

            /** final CGM value */
            const CGM = a * IG + b + noise   // (1), (4)
            
            this.output = { CGM }
            return { CGM }
        }
        return {}
    }

    /**
     * Returns next noise sample, must be called every minute.
     * @param {Date} t - Time of interest
     * @returns {number} noise sample
     */
    protected _getNextNoise(t: Date): number {
        const params = this.evaluateParameterValuesAt(t)
        // update AR model of measurement noise (7), (14)
        const w_v = Math.sqrt(params.sigma_2_w) * this.rng.getNormal()
        const v = params.alpha_w1 * this.v[1] + params.alpha_w2 * this.v[0] + w_v
        this.v[0] = this.v[1]
        this.v[1] = v

        // update AR model of "common component" (13)
        const w_cc = Math.sqrt(params.sigma_2_cc) * this.rng.getNormal()
        const cc = params.alpha_cc1 * this.cc[1] + params.alpha_cc2 * this.cc[0] + w_cc
        this.cc[0] = this.cc[1]
        this.cc[1] = cc

        return v + cc
    }
}

const MS_PER_DAY = 60e3 * 60 * 24

export const Facchinetti2014Parameters = {
    /** coefficient for t-1 in common component */
    alpha_w1: { unit: "1", default: 1.013 },  // eq. (14)
    /** coefficient for t-2 in common component */
    alpha_w2: { unit: "1", default: -0.2135 }, // eq. (14)
    /** sigma^2 in common component in (mg/dl)^2 */
    sigma_2_w: { unit: "(mg/dl)^2", default: 14.45 }, // eq. (14)
    /** coefficient for t-1 in sensor specific */
    alpha_cc1: { unit: "1", default: 1.23 }, // eq. (13)
    /** coefficient for t-2 in sensor specific */
    alpha_cc2: { unit: "1", default: -0.3995 }, // eq. (13)
    /** sigma^2 in sensor specific in (mg/dl)^2 */
    sigma_2_cc: { unit: "(mg/dl)^2", default: 11.3 }, // eq. (13)
    /** coefficient 0 in polynomial a */
    a0: { unit: "1", default: 1.1 }, // Table 1
    /** coefficient 1 in polynomial a */
    a1: { unit: "1/d", default: 2e-4 }, // Table 1
    /** coefficient 2 in polynomial a */
    a2: { unit: "1/d^2", default: 0 }, // Table 1
    /** coefficient 0 in polynomial b */
    b0: { unit: "1", default: -14.8 }, // Table 1
    /** coefficient 1 in polynomial b */
    b1: { unit: "1/d", default: 0.04 }, // Table 1
    /** coefficient 2 in polynomial b */
    b2: { unit: "1/d^2", default: 0 }, // Table 1
    /** sampling time in minutes */
    samplingTime: { unit: "min", default: 5, min: 1, step: 1 },
}


export const html = {
    alpha_w1: "&alpha;<sub>w1</sub>",
    alpha_w2: "&alpha;<sub>w2</sub>",
    alpha_cc1: "&alpha;<sub>cc1</sub>",
    alpha_cc2: "&alpha;<sub>cc2</sub>",
    sigma_2_w: "&sigma;<sub>w</sub><sup>2</sup>",
    sigma_2_cc: "&sigma;<sub>cc</sub><sup>2</sup>",
}


export const i18n_label = {
    en: {
        samplingTime: "Sampling time",
    },
    de: {
        samplingTime: "Abtastzeit",
    },
}


/** Additional information to be displayed in tooltips. */
export const i18n_tooltip = {
    en: {
        alpha_w1: "first coefficient of autoregressive model for noise",
        alpha_w2: "second coefficient of autoregressive model for noise",
        alpha_cc1: "first coefficient of autoregressive model for common component",
        alpha_cc2: "second coefficient of autoregressive model for common component",
        sigma_2_w: "squared standard deviation (variance) of noise",
        sigma_2_cc: "squared standard deviation (variance) of common component",
        a0: "constant coefficient in polynomial a(t) describing devitation of relative sensor error after calibration",
        a1: "linear coefficient in polynomial a(t) describing devitation of relative sensor error after calibration",
        a2: "quadratic coefficient in polynomial a(t) describing devitation of relative sensor error after calibration",
        b0: "constant coefficient in polynomial b(t) describing sensor drift after calibration",
        b1: "linear coefficient in polynomial b(t) describing sensor drift after calibration",
        b2: "quadratic coefficient in polynomial b(t) describing sensor drift after calibration",
    },
}