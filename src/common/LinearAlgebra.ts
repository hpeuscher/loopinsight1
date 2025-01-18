/** 
 * This file is part of LoopInsighT1, an open source tool to
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

/**
 * Performs matrix addition.
 * Adds two matrices of the same dimension.
 * @param {Matrix} A
 * @param {Matrix} B
 * @returns {Matrix} A + B
 */
export function matrixAddition(A: Matrix, B: Matrix): Matrix {
    console.assert(A.length === B.length && A[0].length === B[0].length, "Matrices must be of the same dimension.")
    return A.map((row, i) => row.map((val, j) => val + B[i][j]))
}

/**
 * Performs vector addition.
 * Adds two vectors of the same dimension.
 * @param {Vector} A 
 * @param {Vector} B 
 * @returns {Vector} A + B 
 */
export function vectorAddition(A: Vector, B: Vector): Vector {
    console.assert(A.length === B.length, "Vectors must be of the same dimension.")
    return A.map((val, i) => val + B[i])
}

/**
 * Multiplies a scalar with a matrix.
 * @param {number} a 
 * @param {Matrix} B
 * @returns {Matrix} a * B
 */
export function scalarMultiplyMatrix(a: number, B: Matrix): Matrix {
    return B.map(row => row.map(element => a * element))
}

/**
 * Generates a eye matrix of the given size.
 * @param {number} size 
 * @returns {Matrix} 
 */
export function eye(size: number): Matrix {
    const I = [];
    for (let i = 0; i < size; i++) {
        const row = Array(size).fill(0)
        row[i] = 1
        I.push(row)
    }
    return I
}

/**
 * Performs matrix subtraction.
 * Subtracts matrix B from matrix A of the same dimension.
 * @param {Matrix} A
 * @param {Matrix} B
 * @returns {Matrix} A - B
 */
export function matrixSubtraction(A: Matrix, B: Matrix): Matrix {
    console.assert(A.length === B.length && A[0].length === B[0].length, "Matrices must be of the same dimension.");
    return A.map((row, i) => row.map((val, j) => val - B[i][j]));
}


/**
 * Multiplies the diagonal elements of a matrix by a scalar.
 * @param {Matrix} A - The input matrix.
 * @param {number} scalar - The scalar to multiply with the diagonal.
 * @returns {Matrix} - The resulting matrix with scaled diagonal elements.
 */
export function scalarMultiplyDiagonal(A: Matrix, scalar: number): Matrix {
    console.assert(A.length === A[0].length, "Matrix must be square.");
    
    return A.map((row, i) => 
        row.map((val, j) => (i === j ? val * scalar : val))
    );
}

/**
 * Creates a diagonal matrix with elements from a vector.
 * @param {Vector} v - The vector containing the diagonal elements.
 * @returns {Matrix} - A square matrix with the vector elements as its diagonal.
 */
export function vectorToDiagonalMatrix(v: Vector): Matrix {
    const size = v.length;
    
    return Array.from({ length: size }, (_, i) =>
        Array.from({ length: size }, (_, j) => (i === j ? v[i] : 0))
    );
}
