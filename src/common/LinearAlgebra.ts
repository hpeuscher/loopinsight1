/* This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */


import { Matrix, Vector } from '../types/CommonTypes.js'

/**
 * Transposes matrix.
 * @param {Matrix} A
 * @returns {Matrix} A'
 */
export function transpose(A: Matrix): Matrix {
    return A[0].map( (a_, i) => A.map((a) => a[i]))
} 



/**
 * Performs matrix multiplication.
 * @param {Matrix} A
 * @param {Matrix} B
 * @returns C = A * B
 */
export function matrixMultiplication(A: Matrix, B: Matrix): Matrix {
    console.assert(A[0].length == B.length, "Incompatible size.")
    const C = A.map( // loop over rows of A
        (a) => B[0].map( // loop over columns of B 
            (b_, j) =>  a.reduce( // loop over entries
                (c, a_k, k) => c + a_k*B[k][j], 0) ))
    return C
} 

/**
 * Adds scalar value to entries of matrix diagonal.
 * @param {Matrix} A
 * @param {number} lambda
 * @returns A + lambda * identity_matrix
 */
export function addScalarToDiagonal(A: Matrix, lambda: number): Matrix {
    console.assert(A[0].length == A.length, "Matrix must be square.")
    const n = A.length
    for (let i=0; i<n; i++) {
        A[i][i] = A[i][i] + lambda
    }
    return A
}


/**
 * Returns diagonal entries of matrix.
 * @param {Matrix} A
 * @returns A + lambda * identity_matrix
 */
export function getDiagonal(A: Matrix): Vector {
    console.assert(A[0].length == A.length, "Matrix must be square.")
    return A.map((a,i) => a[i])
} 

/**
 * Adds values to diagonal entries of matrix.
 * @param {Matrix} A
 * @param {Vector} v
 * @returns A + lambda * identity_matrix
 */
export function addToDiagonal(A: Matrix, v: Vector): Matrix {
    console.assert(A[0].length == A.length, "Matrix must be square.")
    console.assert(A.length == v.length, "Sizes are incompatible.")
    return A.map((ai,i) => ai.map( (aij,j) => i==j ? aij + v[i] : aij ))
}


/**
 * Performs matrix-vector multiplication.
 * @param {Matrix} A
 * @param {Matrix} b
 * @returns c = A * b
 */
export function matrixTimesVector(A: Matrix, b: Vector): Vector {
    console.assert(A[0].length == b.length, "Incompatible size.")
    return A.map(// loop over rows of A
        (a) => a.reduce( // loop over entries
                (c, a_k, k) => c + a_k*b[k], 0) )
}


/**
 * Multiplies vector by scalar.
 * @param {Vector} v
 * @param {number} a
 * @returns v * a
 */
export function vectorTimesScalar(v: Vector, a: number): Vector {
    return v.map( (e) => e * a )
}


/**
 * Calculates the sum of squares of a vector.
 * 
 * @param {Vector} v
 * @returns {number} Sum of squares
 */
export function sumOfSquares(v: Vector): number {
    return v.reduce((acc, curr) => acc + Math.pow(curr, 2), 0)
}

/**
 * Calculates the Frobenius norm of a matrix.
 * 
 * @param {Vector} v
 * @returns {number} Sum of squares
 */
export function frobeniusNorm(A: Matrix): number {
    return A.reduce((norm, ai) => 
        norm + ai.reduce((rowsum, aii) => rowsum + aii*aii, 0), 0)
}


