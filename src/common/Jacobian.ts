/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { Matrix, Vector } from '../types/CommonTypes.js'
import { transpose } from './LinearAlgebra.js'

/**
 * Class to compute a Jacobian matrix for a vector-valued differentiable
 * function at a given expansion point.
 */
export default class Jacobian {
    private J: Matrix

    /**
     * Creates a Jacobian matrix.
     * 
     * @param {Function} f - Differentiable function f(x).
     * @param {Vector} x0 - Position to evaluate Jacobian at.
    */
    constructor(f: (x: Vector) => Vector, x0: Vector) {
        let A: Matrix = []
        const y0 = f(x0)
        x0.forEach(function (_v, i) {
            let x = x0.slice()  // copy
            x[i] = x[i] + 1e-10 // TODO
            const y = f(x)
            A.push(y.map((_v, i) => (y[i] - y0[i]) * 1e10))
        })
        // transpose result
        this.J = transpose(A)
    }

    public getMatrix(): Matrix {
        return this.J
    }

}