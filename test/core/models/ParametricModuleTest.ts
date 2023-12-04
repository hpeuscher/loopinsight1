/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import ParametricModule from '../../../src/types/ParametricModule.js'

declare type Constructor = {
    new (...args: any[]): ParametricModule
}

export default function (model: Constructor, commonParameters = {}) {

    if (typeof model === "undefined")
        return

    const instance: ParametricModule = new model()

    describe("#getParameterList", () => {
        it("should return list of model parameters", () => {
            const p = instance.getParameterValues()
            const list = instance.getParameterList()
            // check if parameters really contain list element
            for (const l of list) {
                expect(Object.keys(p)).to.contain(l)
            }
            // vice versa
            // TODO: l contains "common parameters" which are not part of list
            // for (const l of Object.keys(p)) {
            //     expect(list).to.contain(l)
            // }
        })
    })

    describe("#getParameterDescription", () => {
        it("should return description of parameters", () => {
            const desc = instance.getParameterDescription()
            expect(typeof desc).to.equal("object")
            for (const p of Object.keys(desc)) {
                describe(`parameter ${p}`, () => {
                    it("should have property 'default'", () => {
                        expect(desc[p]).to.have.property("default")
                    })
                })
            }
        })
        
        // check if parameters are compatible with CommonSensorParameters
        it("if common sensor parameter is overwritten, unit must match", () => {
            const desc = instance.getParameterDescription()
            for (const p of Object.keys(desc)) {
                if (Object.keys(commonParameters).includes(p)) {
                    if (typeof desc[p].unit !== "undefined") {
                        const expectedUnit = (<any>commonParameters)[p].unit
                        expect(desc[p].unit).to.equal(expectedUnit)
                    }
                }
            }
        })
    })

    const list = instance.getParameterList()
    describe("#getParameterUnit", () => {
        if (list?.length > 0) {
            // module has at least one parameter
            it("should return string for valid parameter", () => {
                const someValidParamName = list[0]
                const unit = instance.getParameterUnit(someValidParamName)
                expect(unit).to.be.a("string")
            })
            it("should return undefined for invalid parameter", () => {
                const unit = instance.getParameterUnit("someInvalidParmName")
                expect(unit).to.be.undefined
            })
        }
    })

    describe("#getParameterValues", () => {
        it("should return module parameters", () => {
            const p = instance.getParameterValues()
            expect(typeof p).to.equal("object")
        })
    })


    describe("#getDefaultParameterValues", () => {
        it("should return module parameters", () => {
            const p = instance.getDefaultParameterValues()
            expect(typeof p).to.equal("object")
        })
    })



    describe("#setParameterValues", () => {
        if (list?.length > 0) {
            // module has at least one parameter
            const someValidParamName = list[0]
            it("should update valid patient parameter " + someValidParamName, () => {
                instance.setParameterValues({ [someValidParamName]: 42 })
                const p = instance.getParameterValues()
                expect(p).to.be.an("object")

                expect(Object.keys(p)).to.contain(someValidParamName)
                expect(p[someValidParamName]).to.equal(42)
            })

            it("should ignore wrong parameter argument", () => {
                instance.setParameterValues(<any>"this is invalid")
            })

            it("should work with invalid parameter", () => {
                instance.setParameterValues({ someInvalidParmName: 42 })
                const p = instance.getParameterValues()
                expect(p).to.be.an("object")

                describe("resulting parameter set", () => {
                    it("should not contain invalid parameter value", () => {
                        expect(Object.keys(p)).to.not.contain("someInvalidParmName")
                    })
                })
            })
        }
    })


    describe("#restoreDefaultParameterValues", () => {
        if (list?.length > 0) {
            // module has at least one parameter
            it("should restore default values of parameters", () => {
                const someValidParamName = list[0]
                instance.restoreDefaultParameterValues()
                const pBefore = JSON.stringify(instance.getParameterValues())
                instance.setParameterValues({ [someValidParamName]: 42 })
                instance.restoreDefaultParameterValues()
                const pAfter = JSON.stringify(instance.getParameterValues())
                expect(pBefore).to.equal(pAfter)
        })
    }})
    
}
