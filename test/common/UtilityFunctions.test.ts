/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import * as UtilityFunctions from '../../src/common/UtilityFunctions.js'

describe("UtilityFunctions", () => {


    
    describe("#generateRandomInt", () => {
        it("should respect lower limit", () => {
            for (let i=0; i<1000; i++) {
                const r = UtilityFunctions.generateRandomInt(42, 50)
                expect(r).to.greaterThanOrEqual(42)
            }
        })
        it("should respect upper limit", () => {
            for (let i=0; i<1000; i++) {
                const r = UtilityFunctions.generateRandomInt(-42, 50)
                expect(r).to.lessThanOrEqual(50)
            }
        })
        it("should be integer", () => {
            for (let i=0; i<1000; i++) {
                const r = UtilityFunctions.generateRandomInt(-42.3, 50.5)
                expect(Math.round(r)).to.equal(r)
            }
        })
    })


    describe("#limit", () => {
        it("should clip to lower limit if present", () => {
            expect(UtilityFunctions.limit(42, 50, 100)).to.equal(50)
            expect(UtilityFunctions.limit(42, NaN, 100)).to.equal(42)
        })
        it("should clip to lower limit if present", () => {
            expect(UtilityFunctions.limit(42, 0, 10)).to.equal(10)
            expect(UtilityFunctions.limit(42, 10, NaN)).to.equal(42)
        })
        it("should leave value untouched if in range", () => {
            expect(UtilityFunctions.limit(42, 20, 100)).to.equal(42)
            expect(UtilityFunctions.limit(-42, -50, -10)).to.equal(-42)
        })
    })


    describe("#quantize", () => {
        it("should round to multiples of quantization step", () => {
            expect(UtilityFunctions.quantize(42, 10)).to.equal(40)
            expect(UtilityFunctions.quantize(42, 30)).to.equal(30)
            expect(UtilityFunctions.quantize(42, 21)).to.equal(42)
            expect(UtilityFunctions.quantize(42, 30.5)).to.equal(30.5)
            expect(UtilityFunctions.quantize(42, 20.5)).to.equal(41)
        })
        it("should do nothing for non-positive quantization step", () => {
            expect(UtilityFunctions.quantize(42, 0)).to.equal(42)
            expect(UtilityFunctions.quantize(42, -10)).to.equal(42)
        })
    })
})