/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'

import LSESolver from '../../src/common/LSESolver.js'
import { Matrix, Vector } from '../../src/types/CommonTypes.js'
import { vectorDifferenceNorm } from '../helper/linalg_helper.js'


describe("LSESolver", () => {
    const A: Matrix = [[1, 2, 3], [2, 4, 9], [3, 16, 27]]
    const solver = new LSESolver(A)

    /**
     * Unit test for solveLSE which should solve a linear system of equations A*x=b
     */
    describe("solve", () => {

        const b: Vector = [1, 2, 3]
        let expected: Vector = [1, 0, 0]

        it("should return correct solution of given LSE", () => {
            const result: Array<number> = solver.solve(b)
            expect(result).to.be.an("array")
            expect(vectorDifferenceNorm(result, expected)).to.lessThan(1e-10)
        })
    })



    describe("#shallowClone", () => {
        const input = [[0, 1], [2, 3]]
        const clone = solver.shallowClone(input)
        expect(clone).to.not.equal(input)
        expect(clone).to.deep.equal(input)
    })


})