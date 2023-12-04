/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import { findLocalJson } from '../../../util/FindLocalModules.js'


for (const type of ["sensor", "actuator"]) {
    const fileList = await findLocalJson(`src/core/${type}s/devices`)

    describe("Devices: " + type + "s", () => {
        for (const id of Object.keys(fileList)) {
            const device = fileList[id]
            describe(id, () => {

                describe("entry type", () => {
                    it("should exist", () => {
                        expect(device).to.haveOwnProperty("type")
                        expect(device.type).to.equal(type)
                    })
                })

                describe("entry model", () => {
                    it("should exist", () => {
                        expect(device).to.haveOwnProperty("model")
                        expect(device.model).to.be.a("string")
                    })
                })

                describe("entry version", () => {
                    it("should exist", () => {
                        expect(device).to.haveOwnProperty("version")
                        expect(device.version).to.be.a("string")
                    })
                })

                describe("entry name", () => {
                    it("should exist", () => {
                        expect(device).to.haveOwnProperty("name")
                        expect(device.name).to.be.a("string")
                    })
                })

                describe("entry parameters", () => {
                    it("should exist", () => {
                        expect(device).to.haveOwnProperty("parameters")
                        expect(device.parameters).to.be.an("object")
                    })
                })
            })
        }
    })
}
