/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */


import { Vector } from '../types/CommonTypes.js'

/**
 * A collection of statistical utility functions.
*/
export default class Statistics {

    /**
     * computes the empirical coefficient of variation of an array of numbers
     * @param {Array} arr 
     * @returns {number} the coefficient of variation
     */
    static coefficientOfVariation(arr: Vector): number {
        return this.std(arr) / this.mean(arr)
    }

    /**
     * Computes the empirical standard deviation of an array of numbers
     * @param {Array} arr 
     * @returns {number} Standard deviation
     */
    static std(arr: Vector): number {
        return Math.sqrt(this.variance(arr))
    }

    /**
     * Computes the empirical variance of an array of numbers
     * @param {Array} arr 
     * @returns {number} Empirical variance
     */
    static variance(arr: Vector): number {
        if (arr.length <= 1)
            return 0
        const m = this.mean(arr)
        return arr.reduce((acc, curr) => acc + (curr - m) ** 2, 0) / (arr.length - 1)
    }

    /**
     * Computes the mean value of an array of numbers
     * @param {Array} arr 
     * @returns {number} Mean value
     */
    static mean(arr: Vector): number {
        if (arr.length < 1)
            return NaN
        return arr.reduce((acc, curr) => acc + curr, 0) / arr.length
    }

}