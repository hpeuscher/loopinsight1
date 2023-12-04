/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { Matrix, Vector } from '../types/CommonTypes.js'

/**
 * solves a linear system A*x=b
 * This implementation is based on:
 *   Numeric Javascript, (C) 2011 by Sébastien Loisel
 */
export default class LSESolver {
    private LU: Matrix
    private P: Vector

    /**
     * constructor
     * 
     * @param {Matrix} A: regular matrix
    */
    constructor(A: Matrix) {
        [this.LU, this.P] = this.computeLU(A)
    }

    /**
     * solves a linear system A*x=b
     * 
     * @param {Vector} b: right hand side vector b
     * @returns {Vector} x: solution of A*x=b	
     */
    public solve(b: Vector): Vector {
        return this.solveWithLU(this.LU, this.P, b)
    }


    /**
     * solves a linear system A*x=b using known LU decomposition of A
     * 
     * This implementation is based on:
     *   Numeric Javascript, (C) 2011 by Sébastien Loisel
     * 
     * @param {Object} LUP: L,U, and pivot of A (result of computeLU)
     * @param {Object} b: right hand side vector b
     * @returns {Array} x: solution of A*x=b	
     */
    private solveWithLU(LU: Matrix, P: Vector, b: Vector): Vector {
        const n = LU.length
        const x = this.shallowClone(b)
        for (let i = 0; i < n; i++) {
            const Pi = P[i]
            if (P[i] !== i) {
                const tmp = x[i]
                x[i] = x[Pi]
                x[Pi] = tmp
            }
            for (let j = 0; j < i; j++) {
                x[i] -= LU[i][j] * x[j]
            }
        }

        for (let i = n - 1; i >= 0; i--) {
            for (let j = i + 1; j < n; j++) {
                x[i] -= LU[i][j] * x[j]
            }
            x[i] /= LU[i][i]
        }
        return x
    }


    /**
     * computes the LU decomposition of a regular matrix.
     * 
     * This implementation is based on:
     *   Numeric Javascript, (C) 2011 by Sébastien Loisel
     * 
     * @param {Matrix} A 
     * @returns {Matrix} LU: lower and upper part in a single matrix
     * @returns {Vector} P: pivoting vector
    */
    private computeLU(A: Matrix): [Matrix, Vector] {
        const n: number = A.length
        const P: Vector = new Array(n)
        const LU: Matrix = this.shallowClone(A)
        // loop over matrix rows
        for (let k = 0; k < n; k++) {
            let Ak: Vector = LU[k]
            // find pivot element
            let Pk: number = k
            let max: number = Math.abs(Ak[k])
            for (let j = k + 1; j < n; j++) {
                const absAjk = Math.abs(LU[j][k])
                if (max < absAjk) {
                    max = absAjk
                    Pk = j
                }
            }
            P[k] = Pk
            // swap rows
            if (Pk != k) {
                LU[k] = LU[Pk]
                LU[Pk] = Ak
                Ak = LU[k]
            }
            // Gaussian elimination
            for (let i = k + 1; i < n; i++) {
                let Ai = LU[i]
                Ai[k] /= Ak[k]
                for (let j = k + 1; j < n; j++) {
                    Ai[j] -= Ai[k] * Ak[j]
                }
            }
        }
        // return LU decomposition and pivoting vector
        return [LU, P]
    }

    /**
     * Returns a shallow clone of an array.
     * 
     * @param a {Type[]} An array 
     * @returns 
    */
    shallowClone<Type>(a: Type[]): Type[] {
        return Array.from(a)
    }

}