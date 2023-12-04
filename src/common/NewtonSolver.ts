/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */


/**
 * Find root of scalar function f(x) using Newton's method.
 */
export default class NewtonSolver {

    /**
     * Creates a NewtonSolver instance.
     * 
     * @param {function} f - Differentiable function f(x)
     */
    constructor(private f: (x: number) => number) {
        this.f = f
    }

    /**
     * Finds root of given function.
     * 
     * @param {number} x0 - initial position
     * @param {number} eps - tolerance (stopping criterion)
     * @returns {number} number z such that f(z)=0, or NaN if no root could be found
     */
    public solve(x0: number, eps: number = 1e-6, maxStep: number = 20): number {
        let x = x0
        const stepSize = 1e-8
        for (let i = 0; i < maxStep; i++) {
            const f_x = this.f(x)
            // check for convergence
            if (Math.abs(f_x) < eps) {
                return x
            }
            // update
            x = x - f_x / (this.f(x + stepSize) - f_x) * stepSize
        }
        return NaN
    }

}

