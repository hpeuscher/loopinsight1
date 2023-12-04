/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */


/**
 * This file illustrates how to use LoopInsighT1 to implement simulations
 *  in Javascript without the browser-based graphical user interface.
 * 
 * Usage:   cd ./examples/MinimalDemo
 *          node --loader ts-node/esm ./MinimalDemoJS.js
 * 
 * Or run the "Run minimal demo (JS)" configuration in VS Code 
 *   (which will support debugging).
 */

import * as fs from 'fs'
import Simulator from '../../src/core/Simulator.js'
import StaticInsulinPump from '../../src/core/actuators/StaticInsulinPump.js'
import ControllerBasalBolus from '../../src/core/controllers/BasalBolus.js'
import VirtualPatientUvaPadova from '../../src/core/models/UvaPadova.js'
import CGM_Breton2008 from '../../src/core/sensors/Breton2008.js'

// prepare the simulator
const sim = new Simulator()

// define a patient object
const patient = new VirtualPatientUvaPadova()
sim.setPatient(patient)

// define a controller/algorithm
const controller = new ControllerBasalBolus({
    premealTime: 30,
    carbFactor: 1.5
})
// automatically configure controller to use patient's typical basal rate
controller.autoConfigure(patient.getPatientProfile())
sim.setController(controller)

// define a sensor
const sensor = new CGM_Breton2008()
sim.setSensor(sensor)

// define an insulin pump
const pump = new StaticInsulinPump()
sim.setActuator(pump)

// define a set of meals
const meals = [
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

// define options
sim.setOptions({
    "t0": new Date("2022-05-01T06:00:00Z"),
    "tmax": new Date("2022-05-01T14:00:00Z"),
})

// start the simulation
const results = sim.runSimulation()

// display the results in the console (or postprocess them as you need)
for (const r of results) {
    console.log(r.t.toLocaleString() + ":  G = " + r.y.Gp.toFixed(2) + " mg/dl")
}

// store results to JSON file
fs.writeFile("./MinimalDemoResults.json",
    JSON.stringify({ results, id: "MinimalDemo" }),
    () => { }
)
