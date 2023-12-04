/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import { ModuleContents, ModuleType } from '../../../src/types/ModuleProfile.js'
import ParametricModule from '../../../src/types/ParametricModule.js'

export default function (type: ModuleType, module: ModuleContents) {
    // let module: ModuleContents
    // module = await import(
    //     `../../../src/core/${filename}`
    // )
const filename = ""
    describe(filename + ": file", () => {
        it("should exist", () => {
            expect(module).to.not.be.undefined
        })
    })
    
    if (typeof module === "undefined")
        return

    const profile = module?.profile
    describe(filename + ": profile", () => {
        it("should not be undefined", () => {
            expect(profile).to.not.be.undefined
        })
        if (typeof profile === "undefined")
            return

        it(`should have type entry \"${type}\"`, () => {
            expect(profile.type).to.equal(type)
        })
    })

    const model = module?.default
    describe(filename + ": model class (as 'export default')", () => {
        it("should not be undefined", () => {
            expect(model).to.not.be.undefined
        })
        it("should have constructor", () => {
            const instance: ParametricModule = new model()
            expect(instance).to.not.be.undefined
        })
        it("constructor should deal with parameters", () => {
            const instance: ParametricModule = new model({ invalidparam: 42 })
            expect(instance).to.not.be.undefined
        })
    })

    return module?.default
}
