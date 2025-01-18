/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { Vector } from '../types/CommonTypes.js'
import Jacobian from './Jacobian.js'
import {
    addScalarToDiagonal,
    frobeniusNorm,
    matrixMultiplication,
    matrixTimesVector,
    sumOfSquares,
    transpose
} from './LinearAlgebra.js'
import LSESolver from './LSESolver.js'


/**
 * Class to find an extremum of multivariable scalar function using
 * Levenberg-Marquart methods.
 */
export default class LevenbergMarquardt {

    /**
     * constructor
     * 
     * @param {function} f differentiable function f(x)
     */
    constructor(private f: (x: Vector) => Vector) {
        this.f = f
    }

    /**
     * Run iterative search for extremum.
     * @param u0 - Initial values.
     * @param lambda - 
     * @param reltol - Stopping criterion (relative change)
     * @param logcb - 
     * @returns 
     */
    public findMinimum(
        u0: Vector,
        lambda: number,
        reltol: number = 1e-3,
        logcb: (msg: string) => void,
        lowerBound?: number,
        upperBound?: number
    ): Vector {
        /** optimization variable */
        let u = u0
        /** 2-norm of  */
        let norm2_old = sumOfSquares(this.f(u))
        const maxIterations = 100
        for (let i = 0; i < maxIterations; i++) {
            // solve for J * dz = f(z)
            const J = new Jacobian(this.f, u).getMatrix()
            const b = this.f(u)
            const JT = transpose(J)
            const JTJ = matrixMultiplication(JT, J)
            const JTb = matrixTimesVector(JT, b)
            // TODO: better regularization of lambda?
            let M = addScalarToDiagonal(JTJ, lambda * frobeniusNorm(JT))
            const dz = new LSESolver(M).solve(JTb)

            // update z and respect limits
            // TODO: this is no good spot to put constraints on u - where is?
            const znew = u.map((v, i) => {
                let newVal = v - dz[i]
                if (typeof lowerBound !== "undefined")
                    newVal = Math.max(lowerBound, newVal)
                if (typeof upperBound !== "undefined")
                    newVal = Math.min(upperBound, newVal)
                return newVal
            });

            /** squared 2-norm */
            const norm2 = sumOfSquares(this.f(znew))

            if (norm2 > norm2_old) {
                // cost funcational deteriorated 
                // -> do not use new values, increase lambda instead
                lambda = lambda * 2 // TODO: find good value
                // log
                logcb(`Step ${i}: J = ${norm2} -> refuse, lambda = ${lambda}`)

            } else {
                // accept new optimized u
                u = znew
                // decrease lambda slightly
                lambda = lambda * 0.8  // TODO: find good value
                // log
                logcb(`Step ${i}: J = ${norm2} -> accept, lambda = ${lambda}`)
                if (Math.abs(norm2_old - norm2) / norm2_old < reltol) {
                    // converged -> break
                    // TODO: improve this stopping criterion
                    return u
                }
                norm2_old = norm2
            }
        }
        return u
    }

}
