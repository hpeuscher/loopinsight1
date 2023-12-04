/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import Statistics from '../../src/common/Statistics.js'

describe("Statistics", () => {

    describe("#mean", () => {
        it("should return correct mean value of sequence 1...6", () => {
            expect(Statistics.mean([1, 2, 3, 4, 5, 6])).to.equal(3.5)
        })
        it("should return value of single number", () => {
            expect(Statistics.mean([42])).to.equal(42)
        })
        it("should return NaN for empty argument", () => {
            expect(Statistics.mean([])).to.NaN
        })
    })


    describe("#std", () => {
        it("should return correct standard deviation", () => {
            expect(Statistics.std([1, 2, 3, 4, 5, 6])).to.equal(Math.sqrt(3.5))
        })
        it("should return zero for single number", () => {
            expect(Statistics.std([42])).to.equal(0)
        })
        it("should return zero for empty argument", () => {
            expect(Statistics.std([])).to.equal(0)
        })
    })

    describe("#coefficientOfVariation", () => {
        it("should return correct mean value", () => {
            expect(Statistics.coefficientOfVariation([1, 2, 3, 4, 5, 6])).to.equal(1 / Math.sqrt(3.5))
        })
        it("should return zero for single number", () => {
            expect(Statistics.coefficientOfVariation([42])).to.equal(0)
        })
    })

})