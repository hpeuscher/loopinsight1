/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { assert, expect } from 'chai'
import { Matrix, Vector } from '../../src/types/CommonTypes.js'

/**
 * utility: compute norm of difference of two vectors
 * (both arrays must have same size)
 * @param {Array} x
 * @param {Array} y
 * @returns \sum{|x_i - y_i|}
 */
export function vectorDifferenceNorm(x: Vector, y: Vector) {
    // check if vectors have compatible size
    if (x.length !== y.length) {
        return NaN
    }
    return x.reduce((n: number, v: number, k: number) => n + Math.abs(x[k] - y[k]), 0)
}

export function assertTolerantMatrixEquality(actual: Matrix, expected: Matrix, epsilon: number) {
    if (actual.length != expected.length) assert.fail
    for (let i = 0; i < actual.length; i++) {
        assertTolerantVectorEquality(actual[i], expected[i], epsilon)
    }
}

export function assertTolerantVectorEquality(actual: Vector, expected: Vector, epsilon: number) {
    if (actual.length != expected.length) assert.fail
    for (let i = 0; i < actual.length; i++) {
        expect(actual[i]).to.be.closeTo(expected[i], epsilon)
    }
}