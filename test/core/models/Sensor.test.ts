/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import Sensor from '../../../src/types/Sensor.js'
import { MeasurementDescription, PatientOutputDescription, TracedMeasurement } from '../../../src/types/Signals.js'
import FindLocalModules from '../../../util/FindLocalModules.js'
import ModuleContentsTest from './ModuleContentsTest.js'
import ParametricModuleTest from './ParametricModuleTest.js'
import IOModuleTest from './IOModuleTest.js'
import { CommonSensorParametersDescription } from '../../../src/core/AbstractSensor.js'
import { ModuleContents } from '../../../src/types/ModuleProfile.js'
import SolverRK4 from '../../../src/core/solvers/SolverRK4.js'

const modelList = await FindLocalModules('src/core/sensors')

for (const filename in modelList) {

    const module: ModuleContents = await import(
        `../../../src/core/sensors/${filename}`
    )

    describe("sensor " + filename, () => {

        // test for file contents
        it("should contain all required elements", () => {
            ModuleContentsTest("sensor", module)
        })

        const model = module.default
        it("default export should be a constructor", () => {
            expect(model).to.not.be.undefined
            expect(new model()).to.not.be.undefined

            // run generic tests for parametric module
            it("should pass tests for interface ParametricModule", () => {
                ParametricModuleTest(model, CommonSensorParametersDescription)
            })

            // instantiate model and run tests for IOModule
            const sensor: Sensor = new model()
            const t = new Date(2023, 7, 21, 11, 0, 0)
            const solver = new SolverRK4()
            sensor.reset(t, 1, solver)

            // run generic tests for IOModule
            IOModuleTest(
                "sensor",
                filename,
                sensor,
                Object.keys(PatientOutputDescription),
                Object.keys(MeasurementDescription),
            )

            describe(filename + "#update", () => {
                it("should compute valid measurements", () => {
                    let s: TracedMeasurement
                    let t: Date
                    // consider full hour
                    t = new Date(2023, 7, 21, 12, 0, 0)
                    sensor.update(t, { Gp: 100 })
                    s = sensor.getOutput()
                    expect(typeof s).to.equal("object")
                    for (const meas in s) {
                        expect(meas).to.not.NaN
                    }
                    // consider full hour plus 1 sec
                    t = new Date(2023, 7, 21, 12, 0, 1)
                    sensor.update(t, { Gp: 100 })
                    s = sensor.getOutput()
                    expect(typeof s).to.equal("object")
                    for (const meas in s) {
                        expect(meas).to.not.NaN
                    }
                })
            })


            describe(filename + "#reset", () => {
                it("should reset sensor to its original state", () => {
                    const sensor: Sensor = new model()
                    const t: Date = new Date(2023, 7, 23, 12, 5, 3)
                    sensor.reset(t, 1, solver)
                    // store original state
                    const before = JSON.stringify(sensor)
                    // pass on some data to instance
                    sensor.update(t, { Gp: 100 })
                    sensor.update(t, { Gp: 80 })
                    // reset
                    sensor.reset(t, 1, solver)
                    // compare
                    const after = JSON.stringify(sensor)
                    expect(before).to.equal(after)
                })
            })
        })

    })
}

