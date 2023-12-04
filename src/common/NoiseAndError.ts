/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import RandomNumberGenerator from '../types/RandomNumberGenerator.js'

/**
 * Helper class to distort a measurement with noise and error.
 */
export default class NoiseAndError {
    /**
     * Creates a new NoiseAndError instance
     * @param {RandomNumberGenerator} rng
     */
    constructor(public rng: RandomNumberGenerator) {
        this.rng = rng
    }

    /**
     * Adds deterministic, statistic and absolute error to a value
     * @param {number} original - Original/true value
     * @param {number} relError - Relative error (0.2 results in gain 1.2)
     * @param {number} std - Standard deviation of normally distributed noise
     * @param {number} bias - Constant offset / bias
     * @returns {number} Value with noise and error
     */
    distortValue(original: number, 
        relError: number = 0, std: number = 0, bias: number = 0)
        : number {

        /** random noise sample */
        const randn = this.rng.getNormal()

        return original * (1 + relError) + randn * std + bias
    }

}