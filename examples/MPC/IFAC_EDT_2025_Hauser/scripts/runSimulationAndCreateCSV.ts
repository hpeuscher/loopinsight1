/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * This file contains a helper function to run the simulation and export the
 * results illustrated in the paper.
 */

import * as fs from 'fs'
import Simulator, { SimulatorOptions } from '../../../../src/core/Simulator.js'
import Actuator from '../../../../src/types/Actuator.js'
import Controller from '../../../../src/types/Controller.js'
import Meal from '../../../../src/types/Meal.js'
import Patient from '../../../../src/types/Patient.js'
import Sensor from '../../../../src/types/Sensor.js'
import { SimulationResult } from '../../../../src/types/SimulationResult.js'

export declare type CSVEntry = {
    symbol: string,
    value: (result: SimulationResult) => number | undefined,
}

export default function (
    patient: Patient,
    sensor: Sensor,
    controller: Controller,
    pump: Actuator,
    meals: Meal[],
    simOptions: SimulatorOptions,
    filename: string,
    csvConfig: CSVEntry[]) {

    const sim = new Simulator()
    sim.setController(controller)
    sim.setActuator(pump)
    sim.setSensor(sensor)
    sim.setPatient(patient)
    sim.setMeals(meals)
    sim.setOptions(simOptions)

    // start the simulation
    const results = sim.runSimulation()

    // prepare CSV file content
    let csv = "Time, " + csvConfig.map((e) => e.symbol).join(", ") + "\n"
    const startTime = results[0].t
    for (const r of results) {
        const MS_PER_MIN = 60000
        const time = Math.round((r.t.getTime() - startTime.getTime()) / MS_PER_MIN)
        csv += time + ", " + csvConfig.map((e) => e.value(r) ?? "NaN").join(", ") + "\n"
    }

    // create CSV file
    fs.writeFile(filename, csv, (err) => {
        if (err) {
            console.error("Error writing CSV file:", err)
        } else {
            console.log(`Results successfully saved to ${filename}`)
        }
    })

}