/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { matrixAddition, 
    vectorAddition, 
    scalarMultiplyMatrix, 
    eye, 
    matrixSubtraction, 
    scalarMultiplyDiagonal, 
    vectorToDiagonalMatrix } from '../../src/common/LinearAlgebra.js';
import { assertTolerantMatrixEquality } from '../helper/linalg_helper.js';

describe("matrixAddition", () => {

    describe("Addition of 2x2 matrices", () => {
        const A = [
            [1, 2],
            [3, 4]
        ];
        const B = [
            [5, 6],
            [7, 8]
        ];
        const expected = [
            [6, 8],
            [10, 12]
        ];
        const epsilon = 1e-6; 

        it("should correctly add two 2x2 matrices", () => {
            const result = matrixAddition(A, B);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Addition of 3x3 matrices", () => {
        const A = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];
        const B = [
            [9, 8, 7],
            [6, 5, 4],
            [3, 2, 1]
        ];
        const expected = [
            [10, 10, 10],
            [10, 10, 10],
            [10, 10, 10]
        ];
        const epsilon = 1e-6;

        it("should correctly add two 3x3 matrices", () => {
            const result = matrixAddition(A, B);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });


    describe("Addition of 1x1 matrices", () => {
        const A = [[5]];
        const B = [[10]];
        const expected = [[15]];
        const epsilon = 1e-6;

        it("should correctly add two 1x1 matrices", () => {
            const result = matrixAddition(A, B);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

});


describe("vectorAddition", () => {

    describe("Addition of 2-element vectors", () => {
        const A = [1, 2];
        const B = [3, 4];
        const expected = [4, 6];
        const epsilon = 1e-6; 

        it("should correctly add two 2-element vectors", () => {
            const result = vectorAddition(A, B);
            assertTolerantMatrixEquality([result], [expected], epsilon); 
        });
    });

    describe("Addition of 3-element vectors", () => {
        const A = [1, 2, 3];
        const B = [4, 5, 6];
        const expected = [5, 7, 9];
        const epsilon = 1e-6;

        it("should correctly add two 3-element vectors", () => {
            const result = vectorAddition(A, B);
            assertTolerantMatrixEquality([result], [expected], epsilon);
        });
    });

    describe("Addition of 1-element vectors", () => {
        const A = [5];
        const B = [10];
        const expected = [15];
        const epsilon = 1e-6;

        it("should correctly add two 1-element vectors", () => {
            const result = vectorAddition(A, B);
            assertTolerantMatrixEquality([result], [expected], epsilon);
        });
    });

    describe("Addition of empty vectors", () => {
        const A: number[] = [];
        const B: number[] = [];
        const expected: number[] = [];
        const epsilon = 1e-6;

        it("should return an empty vector when adding two empty vectors", () => {
            const result = vectorAddition(A, B);
            assertTolerantMatrixEquality([result], [expected], epsilon);
        });
    });

});

describe("scalarMultiplyMatrix", () => {

    describe("Multiplication of a 2x2 matrix by a scalar", () => {
        const scalar = 2;
        const B = [
            [1, 2],
            [3, 4]
        ];
        const expected = [
            [2, 4],
            [6, 8]
        ];
        const epsilon = 1e-6; 

        it("should correctly multiply a 2x2 matrix by a scalar", () => {
            const result = scalarMultiplyMatrix(scalar, B);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Multiplication of a 3x3 matrix by a scalar", () => {
        const scalar = -3;
        const B = [
            [1, -2, 3],
            [4, 0, -5],
            [6, 7, 8]
        ];
        const expected = [
            [-3, 6, -9],
            [-12, 0, 15],
            [-18, -21, -24]
        ];
        const epsilon = 1e-6;

        it("should correctly multiply a 3x3 matrix by a scalar", () => {
            const result = scalarMultiplyMatrix(scalar, B);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Multiplication of a 1x1 matrix by a scalar", () => {
        const scalar = 5;
        const B = [[10]];
        const expected = [[50]];
        const epsilon = 1e-6;

        it("should correctly multiply a 1x1 matrix by a scalar", () => {
            const result = scalarMultiplyMatrix(scalar, B);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Multiplication of a matrix by zero", () => {
        const scalar = 0;
        const B = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];
        const expected = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];
        const epsilon = 1e-6;

        it("should return a zero matrix when multiplying any matrix by zero", () => {
            const result = scalarMultiplyMatrix(scalar, B);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Multiplication of an empty matrix by a scalar", () => {
        const scalar = 5;
        const B: number[][] = [];
        const expected: number[][] = [];
        const epsilon = 1e-6;

        it("should return an empty matrix when multiplying an empty matrix by a scalar", () => {
            const result = scalarMultiplyMatrix(scalar, B);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

});

describe("eye", () => {

    describe("Identity matrix of size 2", () => {
        const size = 2;
        const expected = [
            [1, 0],
            [0, 1]
        ];
        const epsilon = 1e-6; 

        it("should generate a 2x2 identity matrix", () => {
            const result = eye(size);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Identity matrix of size 3", () => {
        const size = 3;
        const expected = [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
        const epsilon = 1e-6;

        it("should generate a 3x3 identity matrix", () => {
            const result = eye(size);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Identity matrix of size 4", () => {
        const size = 4;
        const expected = [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ];
        const epsilon = 1e-6;

        it("should generate a 4x4 identity matrix", () => {
            const result = eye(size);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Identity matrix of size 1", () => {
        const size = 1;
        const expected = [[1]];
        const epsilon = 1e-6;

        it("should generate a 1x1 identity matrix", () => {
            const result = eye(size);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Identity matrix of size 0", () => {
        const size = 0;
        const expected: number[][] = [];
        const epsilon = 1e-6;

        it("should return an empty matrix when size is 0", () => {
            const result = eye(size);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

});

describe("matrixSubtraction", () => {

    describe("Subtraction of two 2x2 matrices", () => {
        const A = [
            [5, 6],
            [7, 8]
        ];
        const B = [
            [1, 2],
            [3, 4]
        ];
        const expected = [
            [4, 4],
            [4, 4]
        ];
        const epsilon = 1e-6; 

        it("should correctly subtract two 2x2 matrices", () => {
            const result = matrixSubtraction(A, B);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Subtraction of two 3x3 matrices", () => {
        const A = [
            [10, 11, 12],
            [13, 14, 15],
            [16, 17, 18]
        ];
        const B = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];
        const expected = [
            [9, 9, 9],
            [9, 9, 9],
            [9, 9, 9]
        ];
        const epsilon = 1e-6;

        it("should correctly subtract two 3x3 matrices", () => {
            const result = matrixSubtraction(A, B);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });


    describe("Subtraction of two 1x1 matrices", () => {
        const A = [[10]];
        const B = [[4]];
        const expected = [[6]];
        const epsilon = 1e-6;

        it("should correctly subtract two 1x1 matrices", () => {
            const result = matrixSubtraction(A, B);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

});

describe("scalarMultiplyDiagonal", () => {

    describe("Scaling diagonal elements of a 2x2 matrix", () => {
        const A = [
            [1, 2],
            [3, 4]
        ];
        const scalar = 2;
        const expected = [
            [2, 2],
            [3, 8]
        ];
        const epsilon = 1e-6; 

        it("should correctly multiply the diagonal elements of a 2x2 matrix by a scalar", () => {
            const result = scalarMultiplyDiagonal(A, scalar);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Scaling diagonal elements of a 3x3 matrix", () => {
        const A = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];
        const scalar = -3;
        const expected = [
            [-3, 2, 3],
            [4, -15, 6],
            [7, 8, -27]
        ];
        const epsilon = 1e-6;

        it("should correctly multiply the diagonal elements of a 3x3 matrix by a scalar", () => {
            const result = scalarMultiplyDiagonal(A, scalar);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });


    describe("Scaling diagonal of a 1x1 matrix", () => {
        const A = [[4]];
        const scalar = 3;
        const expected = [[12]];
        const epsilon = 1e-6;

        it("should correctly multiply the diagonal of a 1x1 matrix by a scalar", () => {
            const result = scalarMultiplyDiagonal(A, scalar);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

});

describe("vectorToDiagonalMatrix", () => {

    describe("Conversion of a 2-element vector to a diagonal matrix", () => {
        const v = [3, 5];
        const expected = [
            [3, 0],
            [0, 5]
        ];
        const epsilon = 1e-6; 

        it("should correctly convert a 2-element vector into a diagonal matrix", () => {
            const result = vectorToDiagonalMatrix(v);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Conversion of a 3-element vector to a diagonal matrix", () => {
        const v = [1, -2, 4];
        const expected = [
            [1, 0, 0],
            [0, -2, 0],
            [0, 0, 4]
        ];
        const epsilon = 1e-6;

        it("should correctly convert a 3-element vector into a diagonal matrix", () => {
            const result = vectorToDiagonalMatrix(v);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Conversion of a 4-element vector to a diagonal matrix", () => {
        const v = [7, 8, 9, 10];
        const expected = [
            [7, 0, 0, 0],
            [0, 8, 0, 0],
            [0, 0, 9, 0],
            [0, 0, 0, 10]
        ];
        const epsilon = 1e-6;

        it("should correctly convert a 4-element vector into a diagonal matrix", () => {
            const result = vectorToDiagonalMatrix(v);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

    describe("Conversion of a 1-element vector to a diagonal matrix", () => {
        const v = [3];
        const expected = [[3]];
        const epsilon = 1e-6;

        it("should correctly convert a 1-element vector into a diagonal matrix", () => {
            const result = vectorToDiagonalMatrix(v);
            assertTolerantMatrixEquality(result, expected, epsilon);
        });
    });

});