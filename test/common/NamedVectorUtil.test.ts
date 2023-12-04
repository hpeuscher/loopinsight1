/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import NamedVectorUtil from '../../src/common/NamedVectorUtil.js'

describe("NamedVectorUtil", () => {

    describe('#timesScalar', () => {
        it("should multiply every value by 2", () => {
            const input = { a: 1, b: 2, c: 3 }
            const expectedOutput = { a: 2, b: 4, c: 6 }
            const output = NamedVectorUtil.timesScalar(input, 2)
            expect(output).to.deep.equal(expectedOutput)
        })
    }),

        describe('#vectorSum', () => {
            it("should element-wise add vectors with equal key sets", () => {
                const firstSummand = { a: 1, b: -1, c: 0 }
                const secondSummand = { a: 0, b: 1, c: 2 }
                const expectedOutput = { a: 1, b: 0, c: 2 }
                const output = NamedVectorUtil.vectorSum(firstSummand, secondSummand)
                expect(output).to.deep.equal(expectedOutput)
            }),

                it("should form union of unequal key sets", () => {
                    const firstSummand = { a: 1, b: -1 }
                    const secondSummand = { b: 1, c: 2 }
                    const expectedOutput = { a: 1, b: 0, c: 2 }
                    const output = NamedVectorUtil.vectorSum(firstSummand, secondSummand)
                    expect(output).to.deep.equal(expectedOutput)
                })
        })

    describe("clone", () => {
        it("should create a shallow clone", () => {
            const input = { a: 1 }
            const output = NamedVectorUtil.clone(input)
            expect(output).to.not.equal(input)
            expect(output).to.deep.equal(input)
        })
    })
})