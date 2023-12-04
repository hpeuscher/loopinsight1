/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import {
    CommonActuatorParametersDescription
} from '../../../src/core/AbstractActuator.js'
import Actuator from '../../../src/types/Actuator.js'
import {
    ControllerOutputDescription, Medication, MedicationDescription
} from '../../../src/types/Signals.js'
import FindLocalModules from '../../../util/FindLocalModules.js'
import IOModuleTest from './IOModuleTest.js'
import ModuleContentsTest from './ModuleContentsTest.js'
import ParametricModuleTest from './ParametricModuleTest.js'
import { ModuleContents } from '../../../src/types/ModuleProfile.js'
import SolverRK4 from '../../../src/core/solvers/SolverRK4.js'

const modelList = await FindLocalModules('src/core/actuators')

for (const filename in modelList) {

    const module: ModuleContents = await import(
        `../../../src/core/actuators/${filename}`
    )

    describe("actuator " + filename, () => {

        // test for file contents
        it("should contain all required elements", () => {
            ModuleContentsTest("actuator", module)
        })

        const model = module.default
        it("default export should be a constructor", () => {
            expect(model).to.not.be.undefined
            expect(new model()).to.not.be.undefined

            // run generic tests for parametric module
            it("should pass tests for interface ParametricModule", () => {
                ParametricModuleTest(model, CommonActuatorParametersDescription)
            })

            // instantiate model and run tests for IOModule
            const actuator: Actuator = new model()
            const t = new Date(2023, 7, 21, 11, 0, 0)
            const t2 = new Date(2023, 7, 21, 12, 0, 0)
            const solver = new SolverRK4()
            actuator.reset?.(t, 1, solver)

            // run generic tests for IOModule
            IOModuleTest(
                actuator, Object.keys(ControllerOutputDescription), Object.keys(MedicationDescription))

            describe(filename + "#update", () => {
                it("should compute medication", () => {
                    const m: Medication = actuator.update(t, { iir: 2, ibolus: 1 })
                    expect(m).to.be.an("object")
                })
            })


            describe(filename + "#reset", () => {
                it("should reset actuator to its original state", () => {
                    actuator.reset(t, 1, solver)
                    // store original state
                    const before = JSON.stringify(actuator)
                    // pass on some data to instance
                    actuator.update(t, { iir: 2, ibolus: 1 })
                    actuator.update(t, { iir: 0, ibolus: 0 })
                    actuator.update(t, { iir: 1, ibolus: 0 })
                    actuator.update(t2, { iir: 1, ibolus: 0 })
                    // reset
                    actuator.reset(t, 1, solver)
                    // compare
                    const after = JSON.stringify(actuator)
                    expect(before).to.equal(after)
                    expect(JSON.parse(after)).to.deep.equal(JSON.parse(before))
                })
            })
        })

    })

}