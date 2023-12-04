/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import {
    CommonControllerParametersDescription
} from '../../../src/core/AbstractController.js'
import Controller from '../../../src/types/Controller.js'
import { PatientProfile } from '../../../src/types/Patient.js'
import {
    ControllerOutput, ControllerOutputDescription, MeasurementDescription
} from '../../../src/types/Signals.js'
import FindLocalModules from '../../../util/FindLocalModules.js'
import IOModuleTest from './IOModuleTest.js'
import ModuleContentsTest from './ModuleContentsTest.js'
import ParametricModuleTest from './ParametricModuleTest.js'
import { ModuleContents } from '../../../src/types/ModuleProfile.js'
import SolverRK4 from '../../../src/core/solvers/SolverRK4.js'

const modelList = await FindLocalModules('src/core/controllers')

for (const filename in modelList) {

    const module: ModuleContents = await import(
        `../../../src/core/controllers/${filename}`
    )

    describe("controller " + filename, () => {

        // test for file contents
        it("should contain all required elements", () => {
            ModuleContentsTest("controller", module)
        })

        const model = module.default
        it("default export should be a constructor", () => {
            expect(model).to.not.be.undefined
            expect(new model()).to.not.be.undefined

            // run generic tests for parametric module
            it("should pass tests for interface ParametricModule", () => {
                ParametricModuleTest(model, CommonControllerParametersDescription)
            })

            // instantiate model and run tests for IOModule
            const controller: Controller = new model()
            const t = new Date(2023, 7, 21, 11, 0, 0)
            const t2 = new Date(2023, 7, 21, 12, 0, 0)
            const solver = new SolverRK4()
            controller.reset(t, 1, solver)

            // run generic tests for IOModule
            IOModuleTest(
                controller, Object.keys(MeasurementDescription), Object.keys(ControllerOutputDescription))

            describe(filename + "#autoConfigure", () => {
                it("should accept patient information (if existent)", () => {
                    const patientProfile = <PatientProfile>{ IIReq: 1 }
                    controller.autoConfigure?.(patientProfile)
                    expect(controller).to.be.an("object")
                })
            })

            describe(filename + "#update", () => {

                // TODO: Add test with and without announcements
                it("should compute treatment", () => {
                    controller.update(t, { CGM: () => 100 }, {})
                    const c: ControllerOutput = controller.getOutput()
                    expect(c).to.be.an("object")
                })

                it("should compute treatment when no announcements are passed on", () => {
                    controller.update(t, { CGM: () => 100 })
                    const c: ControllerOutput = controller.getOutput()
                    expect(typeof c).to.equal("object")
                })
            })

            describe(filename + "#getOutput", () => {
                it("should return object", () => {
                    expect(controller.getOutput()).to.be.an("object")
                })
            })

            describe(filename + "#reset", () => {
                controller.reset(t, 1, solver)
                // store original state
                const stateBefore = JSON.stringify(controller)
                // store original output
                const outputBefore = JSON.stringify(controller.getOutput())
                // pass on some data to instance
                controller.update(t, { CGM: () => 100 })
                controller.update(t, { CGM: () => 120 })
                controller.update(t, { CGM: () => 110 })
                controller.update(t2, { CGM: () => 110 })
                // reset
                controller.reset(t, 1, solver)
                // compare
                const stateAfter = JSON.stringify(controller)
                const outputAfter = JSON.stringify(controller.getOutput())
                it("should reset controller output", () => {
                    expect(outputAfter).to.equal(outputBefore)
                })
                it("should reset internal controller state", () => {
                    expect(stateAfter).to.equal(stateBefore)
                })
            })
        })

    })
}