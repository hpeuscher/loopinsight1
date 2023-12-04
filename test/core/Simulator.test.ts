/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { expect } from 'chai'
import Simulator, { SimulatorOptions } from '../../src/core/Simulator.js'
import StaticInsulinPump from '../../src/core/actuators/StaticInsulinPump.js'
import ControllerBasalBolus from '../../src/core/controllers/BasalBolus.js'
import VirtualPatientUvaPadova from '../../src/core/models/UvaPadova.js'
import CGM_Breton2008 from '../../src/core/sensors/Breton2008.js'
import Controller from '../../src/types/Controller.js'
import Meal from '../../src/types/Meal.js'
import Patient from '../../src/types/Patient.js'
import { SimulationResult } from '../../src/types/SimulationResult.js'

describe("Simulator", () => {

    const sim = new Simulator()

    describe("#setPatient", () => {
        it("should accept patient interface", () => {
            const patient: Patient = new VirtualPatientUvaPadova()
            sim.setPatient(patient)
        })
    })

    describe("#setController", () => {
        it("should accept controller interface", () => {
            const controller: Controller = new ControllerBasalBolus({
                basalRate: 1,
                premealTime: 30, carbFactor: 1.5 // meal bolus
            })
            sim.setController(controller)
        })
    })

    describe("#setSensor", () => {
        it("should accept sensor interface", () => {
            const sensor = new CGM_Breton2008()
            sim.setSensor(sensor)
        })
    })

    describe("#setActuator", () => {
        it("should accept actuator interface", () => {
            const pump = new StaticInsulinPump()
            sim.setActuator(pump)
        })
    })

    describe("#setMeals", () => {
        it("should accept meals and announcements", () => {
            const meals: Meal[] = [
                {
                    start: new Date("2022-05-01T08:00:00Z"),
                    duration: 15,
                    carbs: 20,
                    announcement: {
                        start: new Date("2022-05-01T08:00:00Z"),
                        carbs: 20,
                        time: new Date("2022-05-01T07:00:00Z"),
                    },
                },
            ]
            sim.setMeals(meals)
        })
    })

    describe("#setOptions", () => {
        it("should accept options", () => {
            const simOptions: SimulatorOptions = {
                "t0": new Date("2022-05-01T06:00:00Z"),
                "tmax": new Date("2022-05-01T14:00:00Z"),
            }
            sim.setOptions(simOptions)
        })
    })

    describe("#runSimulation", () => {
        it("should perform simulation and return simulation results", () => {
            const results: SimulationResult[] = sim.runSimulation()
            expect(results).to.be.an("Array")
            describe("results", () => {
                it("should contain at least one entry", () => {
                    expect(results).to.have.length.above(0)
                })
            })
            describe("final simulation time", () => {
                it("should equal options.tmax if present", () => {
                    expect(results.pop()!.t.toISOString()).to.equal(new Date("2022-05-01T14:00:00Z").toISOString())
                })
                it("should be chosen automatically otherwise", () => {
                    sim.setOptions({ "t0": new Date("2022-05-01T06:00:00Z"), "tmax": undefined })
                    const results: SimulationResult[] = sim.runSimulation()
                    expect(results.pop()!.t.toISOString()).to.equal(new Date("2022-05-01T07:00:00Z").toISOString())
                })
            })
        })
    })

    describe("#getSimulationResults", () => {
        it("should return simulation results", () => {
            const results: SimulationResult[] = sim.getSimulationResults()
            expect(results).to.be.an("Array")
        })
    })

    // TODO include different time steps
})
