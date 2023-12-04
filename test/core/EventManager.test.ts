/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import AnnouncementManager, { EventList, FilterFunction } from '../../src/core/EventManager.js'

type TestType = {
    name: string
    value: number
}

describe("EventManager", () => {

    let manager: AnnouncementManager

    let list: EventList<TestType> = {
        a: { name: "A", value: 10 },
        b: { name: "B", value: 40 },
        c: { name: "C", value: 90 },
        d: { name: "C", value: 150 },
    }


    it("should have a constructor", () => {
        manager = new AnnouncementManager()
        expect(manager).to.be.an("object")
    })

    describe("#update", () => {
        it("should find events according to filter rule", () => {
            const filter1: FilterFunction = (id: string) => list[id].value > 100
            const step1 = manager.update(list, filter1)
            expect(step1).to.deep.equal(["d"])
            const filter2: FilterFunction = (id: string) => list[id].value > 70
            const step2 = manager.update(list, filter2)
            expect(step2).to.deep.equal(["c"])
        })
        it("should return all unhandled events it no rule is defined", () => {
            const step3 = manager.update(list)
            expect(step3).to.deep.equal(["a", "b"])
        })
    })

    describe("#reset", () => {
        it("should find events again after a reset", () => {
            manager.reset()
            const filter2: FilterFunction = (id: string) => list[id].value > 0
            const step2 = manager.update(list, filter2)
            expect(step2).to.deep.equal(["a", "b", "c", "d"])
        })

    })
})