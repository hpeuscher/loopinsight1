/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * This file illustrates how LoopInsighT1 can generate simulated blood glucose
 * curves from virtual patients with different circadian variability of their
 * insulin sensitivity.
 * 
 * Usage:   cd ./examples/CircadianVariability
 *          node --loader ts-node/esm ./CircadianVariability.ts
 * 
 */

import * as fs from 'fs'
import Simulator, { SimulatorOptions } from '../../src/core/Simulator.js'
import StaticInsulinPump from '../../src/core/actuators/StaticInsulinPump.js'
import ControllerBasalBolus from '../../src/core/controllers/BasalBolus.js'
import IdealCGM from '../../src/core/sensors/IdealCGM.js'
import UvaPadova_Visentin2015 from '../../src/core/models/UvaPadova_Visentin2015.js'
import RNG_Ziggurat_SHR3 from '../../src/common/random/RNG_Ziggurat_SHR3.js'
import DailyProfile, { InterpolationMethod } from '../../src/common/DailyProfile.js'

// prepare the simulator
const sim = new Simulator()

// define a controller/algorithm
const controller = new ControllerBasalBolus()
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
    "tmax": new Date("2024-07-21T00:00:00Z"),
}
sim.setOptions(simOptions)

let RNG = new RNG_Ziggurat_SHR3()
let runs = []

for (let i=0; i<10; i++) {
    // generate random virtual patient

    // insulin sensitivity at breakfast
    const B = 1 + 0.2 * RNG.getNormal()
    // insulin sensitivity at lunch
    const L = 1 + 0.2 * RNG.getNormal()
    // insulin sensitivity at dinner
    const D = 1 + 0.2 * RNG.getNormal()

    const patient = new UvaPadova_Visentin2015({
        kir: <any>new DailyProfile([[0, D], [4, B], [11, L], [17, D]], InterpolationMethod.SMOOTHSTEP)
    })
    sim.setPatient(patient)

    // automatically configure controller to use patient's typical basal rate
    controller.autoConfigure(patient.getPatientProfile())

    // start the simulation
    runs.push(sim.runSimulation())

}

// display the results in the console (or postprocess them as you need)
const MS_PER_HOUR = 60e3
let csv = "Time, " + runs.map((r,id)=> "Patient_"+(id+1)).join(", ") + "\n"
const t_ = runs[0].map(r=> r.t)
for (const t of t_) {
    csv = csv + (t.valueOf() - t_[0].valueOf()) / MS_PER_HOUR
    for (const run of runs) {
        const idx =  run.findIndex(r => r.t.valueOf() == t.valueOf())
        csv = csv + ", " + (idx < 0 ? "NaN" : run[idx].y.Gp)
    }
    csv = csv + "\n"
}

// store results to JSON file
fs.writeFile("./CircadianVariability.csv",
    csv,
    function (err: NodeJS.ErrnoException | null) {
        if (err) {
            throw err
        }
        console.log("Done! Now run preprocessing.")
    }
)
