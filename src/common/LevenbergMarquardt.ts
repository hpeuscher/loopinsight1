/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { Matrix, Vector } from '../types/CommonTypes.js'
import Jacobian from './Jacobian.js'
import {
    addScalarToDiagonal,
    addToDiagonal,
    frobeniusNorm,
    getDiagonal,
    matrixMultiplication,
    matrixTimesVector,
    sumOfSquares,
    transpose,
    vectorTimesScalar
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
    public findMinimum(u0: Vector, lambda: number, reltol: number = 1e-6, logcb: (msg: string) => void): Vector {
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

            // update z
            // TODO: this is no good spot to put constraints on u - where is?
            const znew = u.map((v, i) => Math.max(0, v - dz[i]))

            // log
            logcb(`Step ${i}: J = ${b}`)

            /** squared 2-norm */
            const norm2 = sumOfSquares(this.f(znew))
            if (norm2 > norm2_old) {
                // cost funcational deteriorated 
                // -> do not use new values, increase lambda instead
                lambda = lambda * 5 // TODO: find good value

            } else {
                u = znew
                // decrease lambda slightly
                lambda = lambda / 1.25  // TODO: find good value
                if (Math.sqrt(norm2_old / norm2) - 1 < reltol) {
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




