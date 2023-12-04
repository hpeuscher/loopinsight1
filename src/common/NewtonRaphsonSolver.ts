/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { Vector } from '../types/CommonTypes.js'
import Jacobian from './Jacobian.js'
import LSESolver from './LSESolver.js'

/**
 * Class to find a zero of the vector-valued function f(x) using Newton's method
 */
export default class NewtonRaphsonSolver {

    /**
     * constructor
     * 
     * @param {function} f differentiable function f(x)
     */
    constructor(private f: (x: Vector) => Vector) {
        this.f = f
    }


    /**
     * find a zero of the vector-valued function f(x) using Newton's method
     * 
     * @param {Vector} x0 - Initial position
     * @param {number} eps - Tolerance (for stopping criterion)
     * @returns {Vector} Vector z such that f(z)=0, or undefined if no root could be found
     */
    public solve(x0: Vector, eps: number = 1e-8): Vector | undefined {
        let z = x0
        // max 10 Newton-Raphson steps
        for (let i = 0; i < 10; i++) {
            /** squared 2-norm */
            const norm2 = this.sumOfSquares(this.f(z))
            if (norm2 < eps * eps) {
                // converged
                return z
            }
            // solve for J * dz = f(z)
            const J = new Jacobian(this.f, z).getMatrix()
            const b = this.f(z)
            const dz = new LSESolver(J).solve(b)
            // update z
            z = z.map((v, i) => (v - dz[i]))
        }
        // no result found
        return undefined
    }

    /**
     * Calculates the sum of squares of a vector.
     * 
     * @param {Vector} v
     * @returns {number} Sum of squares
     */
    public sumOfSquares(v: Vector): number {
        return v.reduce((acc, curr) => acc + Math.pow(curr, 2), 0)
    }

}

