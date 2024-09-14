/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * Minimal headless example of Hovorka's NMPC controller.
 * Note that the control model is identical to the simulation model.
 * 
 * Usage:   cd ./examples/MPC
 *          node --loader ts-node/esm ./MPC.ts
 */

import Simulator, { SimulatorOptions } from '../../src/core/Simulator.js'
import StaticInsulinPump from '../../src/core/actuators/StaticInsulinPump.js'
import ControllerMPC from '../../src/core/controllers/MPC_Hovorka2004.js'
import IdealCGM from '../../src/core/sensors/IdealCGM.js'
import Cambridge from '../../src/core/models/Cambridge.js'

// prepare the simulator
const sim = new Simulator()

// define a controller/algorithm
const controller = new ControllerMPC()
sim.setController(controller)

// define a sensor
const sensor = new IdealCGM
sim.setSensor(sensor)

// define an insulin pump
const pump = new StaticInsulinPump()
sim.setActuator(pump)

// define options
const simOptions: SimulatorOptions = {
    "t0": new Date("2024-07-20T00:00:00Z"),
    "tmax": new Date("2024-07-20T10:00:00Z"),
}
sim.setOptions(simOptions)

const patient = new Cambridge()
sim.setPatient(patient)

// start the simulation
const results = sim.runSimulation()

// display the results in the console (or postprocess them as you need)
for (const r of results) {
    console.log(r.t.toLocaleString() + ":  G = " + r.y?.Gp?.toFixed(2) + " mg/dl")
}