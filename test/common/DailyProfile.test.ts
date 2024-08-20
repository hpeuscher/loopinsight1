/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import DailyProfile, {
    getTODfromDate, InterpolationMethod
} from '../../src/common/DailyProfile.js'

describe("DailyProfile", () => {

    describe("#getTODfromDate", () => {
        const expected = [
            { date: new Date(2024, 7, 15, 0, 0, 0), tod: 0 },
            { date: new Date(2024, 7, 15, 0, 0, 1), tod: 1 / 3600 },
            { date: new Date(2024, 7, 15, 0, 1, 0), tod: 1 / 60 },
            { date: new Date(2024, 7, 15, 1, 0, 0), tod: 1 },
            { date: new Date(2024, 7, 15, 2, 0, 0), tod: 2 },
            { date: new Date(2024, 7, 15, 23, 45, 0), tod: 23.75 },
        ]

        it("should convert times correctly", () => {
            for (const e of expected) {
                expect(getTODfromDate(e.date)).to.equal(e.tod)
            }
        })
    })

    describe("#constructor", () => {
        it("should throw error for empty profile", () => {
            expect(() => new DailyProfile([])).to.throw()
        })
        it("should throw error for profile if first time is not zero", () => {
            expect(() => new DailyProfile([[1, 42]])).to.throw()
        })
    })

    describe("#sortNodes", () => {
        it("should sort nodes", () => {
            const zoh1 = new DailyProfile([[0, 42], [5, 42], [2, 42], [15, 42]])
            zoh1.sortNodes()
            expect(zoh1.nodes[0][0]).to.equal(0)
            expect(zoh1.nodes[1][0]).to.equal(2)
            expect(zoh1.nodes[2][0]).to.equal(5)
            expect(zoh1.nodes[3][0]).to.equal(15)
        })
    })

    describe("#insertNode", () => {
        const zoh1 = new DailyProfile([[0, 42], [5, 5]])
        it("should insert node ", () => {
            zoh1.insertNode([0, 20])
            expect(zoh1.nodes[0][1]).to.equal(20)
        })
        it("should insert node ", () => {
            zoh1.insertNode([2, 10])
            expect(zoh1.nodes[1][1]).to.equal(10)
        })
    })

    describe("#removeNodeAt", () => {
        it("should remove node", () => {
            const zoh1 = new DailyProfile([[0, 5], [2, 1], [5, 5], [15, 42]])
            zoh1.removeNodeAt(2)
            expect(zoh1.nodes).to.deep.equal([[0, 5], [5, 5], [15, 42]])
        })
    })

    describe("#_interp0", () => {
        it("should perform interpolation of zero order", () => {
            const zoh1 = new DailyProfile([[0, 42]], InterpolationMethod.ZEROORDER)
            expect(zoh1._interp0(2)).to.equal(42)
            expect(zoh1._interp0(-1)).to.be.NaN
            const zoh2 = new DailyProfile([[0, 42], [1, 43]], InterpolationMethod.ZEROORDER)
            expect(zoh2._interp0(0.99)).to.equal(42)
            expect(zoh2._interp0(1)).to.equal(43)
            expect(zoh2._interp0(23)).to.equal(43)
            const zoh3 = new DailyProfile([[0, 42], [1, 43], [2, 44]], InterpolationMethod.ZEROORDER)
            expect(zoh3._interp0(0.99)).to.equal(42)
            expect(zoh3._interp0(1)).to.equal(43)
            expect(zoh3._interp0(2)).to.equal(44)
            expect(zoh3._interp0(23)).to.equal(44)
        })
    })

    describe("#_interp1", () => {
        it("should perform interpolation of first order", () => {
            const zoh1 = new DailyProfile([[0, 42]], InterpolationMethod.LINEAR)
            expect(zoh1._interp1(2)).to.equal(42)
            expect(zoh1._interp1(-1)).to.be.NaN
            const zoh2 = new DailyProfile([[0, 20], [2, 42]], InterpolationMethod.LINEAR)
            expect(zoh2._interp1(0)).to.equal(20)
            expect(zoh2._interp1(1)).to.equal(31)
            expect(zoh2._interp1(2)).to.equal(42)
            expect(zoh2._interp1(23)).to.equal(21)
            const zoh3 = new DailyProfile([[0, 42], [1, 0], [2, 20]], InterpolationMethod.LINEAR)
            expect(zoh3._interp1(0.5)).to.equal(21)
            expect(zoh3._interp1(1)).to.equal(0)
            expect(zoh3._interp1(1.5)).to.equal(10)
            expect(zoh3._interp1(1.75)).to.equal(15)
            expect(zoh3._interp1(2)).to.equal(20)
            expect(zoh3._interp1(23)).to.equal(41)
        })
    })

    describe("#_interp_smooth", () => {
        it("should perform smoothstep interpolation for N>=2", () => {
            const zoh1 = new DailyProfile([[0, 42]], InterpolationMethod.SMOOTHSTEP)
            expect(zoh1._interp_smooth(2)).to.equal(42)
            expect(zoh1._interp_smooth(-1)).to.be.NaN
            const zoh2 = new DailyProfile([[0, 20], [2, 42]], InterpolationMethod.SMOOTHSTEP)
            expect(zoh2._interp_smooth(0)).to.equal(31)
            expect(zoh2._interp_smooth(1)).to.equal(20)
            expect(zoh2._interp_smooth(2)).to.equal(31)
            expect(zoh2._interp_smooth(3)).to.equal(42)
            expect(zoh2._interp_smooth(23)).to.equal(42)
            const zoh3 = new DailyProfile([[0, 42], [2, 0], [8, 20]], InterpolationMethod.SMOOTHSTEP)
            expect(zoh3._interp_smooth(0)).to.equal(31)
            expect(zoh3._interp_smooth(2)).to.equal(21)
            expect(zoh3._interp_smooth(8)).to.equal(10)
        })
    })

    describe("#getAt", () => {
        it("should perform interpolation for given date", () => {
            const zoh0 = new DailyProfile([[0, 1], [2, 5], [4, 1]], InterpolationMethod.ZEROORDER)
            expect(zoh0.getAt(new Date(2024, 7, 15, 1, 0, 0))).to.equal(1)
            const zoh1 = new DailyProfile([[0, 1], [2, 5], [4, 1]], InterpolationMethod.LINEAR)
            expect(zoh1.getAt(new Date(2024, 7, 15, 1, 0, 0))).to.equal(3)
            expect(zoh1.getAt(new Date(2024, 7, 15, 3, 0, 0))).to.equal(3)
            // const zoh2 = new DailyProfile([[0, 1], [2, 5], [4, 1]], Method.SMOOTHSTEP)
            // expect(zoh2.getAt(new Date(2024, 7, 15, 1, 0, 0) )).to.equal(4)
            // expect(zoh2.getAt(new Date(2024, 7, 15, 3, 0, 0) )).to.equal(4)

        })
    })


})