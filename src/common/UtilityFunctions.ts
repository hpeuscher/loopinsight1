/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */


/**
 * generate a (uniformly distributed) random integer within given interval
 * @param {number} min - lower boundary
 * @param {number} max - upper boundary
 * @returns {number} random integer
 */
export function generateRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min)
}

/**
 * constrain a number to an interval
 * @param {number} input - value to put in boundaries
 * @param {number} min - lower boundary
 * @param {number} max - upper boundary
 * @returns {number} input within boundaries
 */
export function limit(input: number, 
    min: number = -Infinity, 
    max: number = +Infinity): number {

    if (input > max) {
        return max
    }
    if (input < min) {
        return min
    }
    return input
}

/**
 * Rounds a number to multiple of increment
 * @param {number} input - value to quantize
 * @param {number} increment - resolution (must be strictly positive)
 * @returns {number} quantized input value
 */
export function quantize(input: number, increment: number): number {
    return increment > 0 ? increment * Math.round(input / increment) : input
}

/**
 * Rounds a number down to multiple of increment
 * @param {number} input - value to quantize
 * @param {number} increment - resolution (must be strictly positive)
 * @returns {number} quantized input value
 */
export function quantizeFloor(input: number, increment: number): number {
    return increment > 0 ? increment * Math.floor(input / increment) : input
}

