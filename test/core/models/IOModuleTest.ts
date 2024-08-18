/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import IOModule from '../../../src/types/IOModule.js'
import { ModuleType } from '../../../src/types/ModuleProfile.js'

export default async function (
    type: ModuleType,
    filename: string,
    instance: IOModule,
    inputNames: string[],
    outputNames: string[]
) {

    describe("interface IOModule", () => {

        if (typeof instance === "undefined")
            return

        describe(filename + "#getModelInfo", () => {
            it("should return meta information about the model", () => {
                const modelInfo = instance.getModelInfo()
                expect(modelInfo).to.be.an("object")
                describe("model id", () => {
                    it("should match filename", () => {
                        expect(modelInfo.id).to.equal(filename)
                    })
                })
                describe("model type", () => {
                    it("model type should be " + type, () => {
                        expect(modelInfo.type).to.equal(type)
                    })
                })
            })
        })

        describe("#getInputList", () => {
            let inputs = instance.getInputList()
            it("should return list of inputs as string[]", () => {
                expect(inputs).to.be.an("array")
                for (const input of inputs) {
                    expect(input).to.be.a("string")
                }
            })
            it("elements should be valid input names", () => {
                for (const input of inputs) {
                    expect(inputNames).to.contain(input)
                }
            })
        })

        describe("#getOutputList", () => {
            let outputs = instance.getOutputList()
            it("should return list of outputs as string[]", () => {
                expect(outputs).to.be.an("array")
                for (const output of outputs) {
                    expect(output).to.be.a("string")
                }
            })
            it("elements should be valid input names", () => {
                for (const output of outputs) {
                    expect(outputNames).to.contain(output)
                }
            })
        })

    })
}
