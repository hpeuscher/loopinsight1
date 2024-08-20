/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/*
The CGM sensor model implemented in this file uses information from:

[Breton, JDST, 2008]
    Breton, M.; Kovatchev, B.:
    "Analysis, Modeling, and Simulation of the Accuracy of Continuous 
     Glucose Sensors"
    Journal of Diabetes Science and Technology, Volume 2, Issue 5, 2008

*/

import {
    isMultipleOfSamplingTime, nextUpdateTime
} from '../../common/DateUtility.js'
import JohnsonTransform from '../../common/JohnsonTransform.js'
import { limit, quantizeFloor } from '../../common/UtilityFunctions.js'
import RNG_Ziggurat_SHR3 from '../../common/random/RNG_Ziggurat_SHR3.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import { ParameterDescriptions } from '../../types/ParametricModule.js'
import { NormalRandomNumberGenerator } from '../../types/RandomNumberGenerator.js'
import Sensor, { Measurement, PatientOutput } from '../../types/Sensor.js'
import AbstractSensor from '../AbstractSensor.js'


export const profile: ModuleProfile = {
    type: "sensor",
    id: "Breton2008",
    version: "2.1.0",
    name: "CGM sensor (Breton 2008)",
}

/** Sensor model according to Breton 2008 */
export default class CGM_Breton2008
    extends AbstractSensor<typeof Breton2008Parameters>
    implements Sensor {

    /** random number generator */
    protected rng!: NormalRandomNumberGenerator
    /** autoregressive state */
    protected ARstate!: number
    /** buffer to generate 15min straight error lines */
    protected straightLinesBuffer!: number[]
    /** buffer to generate noise */
    protected noiseBuffer!: number[]

    constructor() {
        super()
        this.rng = new RNG_Ziggurat_SHR3()
    }

    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array<keyof PatientOutput> {
        return ["Gp"]
    }

    getOutputList(): Array<keyof Measurement> {
        return ["CGM"]
    }

    getParameterDescription() {
        return Breton2008Parameters
    }

    override reset(t: Date, seed: number = 1): void {
        super.reset(t, seed)
        this.rng.setSeed(seed)
        this.rng.reset()
        // clear buffers
        this.noiseBuffer = []
        this.straightLinesBuffer = []
        // initialize autoregressive model state
        this.ARstate = this.rng.getNormal()
        // create first value for straight line generation
        this.straightLinesBuffer.push(JohnsonTransform(this.ARstate))

    }

    override getNextUpdateTime(t: Date) {
        // call every minute (to update sensor noise)
        return nextUpdateTime(t, 1)
    }


    update(t: Date, y: PatientOutput) {
        /** sensor parameters */
        const params = this.evaluateParameterValuesAt(t)

        // update stochastic error (once a minute!)
        const sensorNoise = this._getNextNoise(params.PACF)

        if (isMultipleOfSamplingTime(t, params.samplingTime)) {
            /** glucose concentration in interstitium */
            const IG: number = y.Gt || y.Gp || NaN  // TODO

            // relative error and bias
            let CGM = params.alpha * IG + params.beta

            // add noise
            CGM += sensorNoise

            // sensor min und max
            CGM = limit(CGM, params.min, params.max)

            // quantization
            CGM = quantizeFloor(CGM, params.resolution)

            this.output = { CGM }
            return { CGM }
        }
        return {}
    }

    /**
     * Returns next noise sample, must be called every minute.
     * @param {number} PACF - partial autocorrelation function coefficient
     * @returns {number} noise sample
     */
    protected _getNextNoise(PACF: number): number {
        if (this.noiseBuffer.length < 8) {
            // need to create additional noise values
            this._generateNoise(PACF)
        }
        // pick left-most element and remove it from buffer
        const nextNoise = this.noiseBuffer[0]
        this.noiseBuffer.shift()
        return nextNoise
    }

    /**
     * Generates new values for noise sequence and stores them to buffer.
     * @param {number} PACF - partial autocorrelation function coefficient
     */
    protected _generateNoise(PACF: number): void {
        // propagate autoregressive model
        this.ARstate = PACF * (this.ARstate + this.rng.getNormal())

        // pick last Johnson-transformed value 
        // (it's the last sample of straightLinesBuffer)
        const prevEdge: number = this.straightLinesBuffer.at(-1)!
        // create next edge
        const nextEdge = JohnsonTransform(this.ARstate)
        // interpolate them with a straight line
        for (let k = 1; k <= 15; k++) {
            const nextSample = prevEdge + (nextEdge - prevEdge) * k / 15
            this.straightLinesBuffer.push(nextSample)
        }
        if (this.straightLinesBuffer.length == 16) {
            // this is the very first interval
            for (let k = 0; k < 8; k++) {
                this.noiseBuffer.push(this.straightLinesBuffer[k])
            }
        }
        else {
            // apply moving average filter
            for (let k = 0; k < 15; k++) {
                const nextNoise = this.straightLinesBuffer.slice(k, k + 15)
                    .reduce((acc, curr) => acc + curr, 0) / 15
                this.noiseBuffer.push(nextNoise)
            }
        }
        // leave 15 elements in buffer
        this.straightLinesBuffer = this.straightLinesBuffer.slice(-15)
    }

}


export const Breton2008Parameters = {
    /** partial autocorrelation function coefficient (constant in paper) */
    PACF: { unit: "1", default: 0.7, min: 0, max: 1, step: 0.1 },
    alpha: { unit: "1", default: 1 },
    beta: { unit: "mg/dl", default: 0 },
    min: { unit: "mg/dl", default: 0, min: 0 },
    max: { unit: "mg/dl", default: 1000, min: 0 },
    /** resolution in mg/dl */
    resolution: { unit: "mg/dl", default: 0, min: 0, step: 1 },
    /** sampling time in minutes */
    samplingTime: { unit: "min", default: 5, min: 1, step: 1 },
} satisfies ParameterDescriptions




export const i18n_label = {
    en: {
        min: "Minimum",
        max: "Maximum",
        resolution: "Resolution",
        samplingTime: "Sampling time",
    },
    de: {
        min: "Minimum",
        max: "Maximum",
        resolution: "Auflösung",
        samplingTime: "Abtastzeit",
    },
}


export const i18n_tooltip = {
    en: {
        PACF: "Partial autocorrelation function coefficient (fixed to 0.7 in Breton's paper)",
        alpha: "Calibration parameter for relative error",
        beta: "Calibration parameter for constant offset",
    },
}
