/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'

import MRG32K3A from '../../../src/common/random/RNG_MRG32K3A.js'
import Statistics from '../../../src/common/Statistics.js'
import { Vector } from '../../../src/types/CommonTypes.js'

describe("RNG_MRG32K3A", () => {
    let rng = new MRG32K3A()

    rng.reset()

    // draw uniformly distributed numbers
    let z: Vector = []
    let mn = 1
    let mx = 0
    for (let i = 0; i < 1e6; i++) {
        const r = rng.getUniform()
        z.push(r)
        // compute min and max on the fly
        mn = Math.min(mn, r)
        mx = Math.max(mx, r)
    }


    describe("uniformly distributed numbers must be in [0,1]", () => {
        it("minimum number should be positive", () => {
            expect(mn).to.greaterThanOrEqual(0)
        })
        it("maximum number should be <=1", () => {
            expect(mx).to.lessThanOrEqual(1)
        })
    })


    describe("mean value of uniformly distributed numbers", () => {
        const m = Statistics.mean(z)
        it("should be 0.5", () => {
            expect(Math.abs(m - 0.5)).to.lessThan(1e-2)
        })
    })


    describe("variance of uniformly distributed numbers", () => {
        const v = Statistics.variance(z)
        it("should be 1/12", () => {
            expect(Math.abs(v * 12 - 1)).to.lessThan(1e-2)
        })
    })


})