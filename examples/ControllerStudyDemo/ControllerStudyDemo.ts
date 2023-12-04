/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * This file performs two simulations with identical scenarios but
 * different controller algorithms. The results are stored to a
 * JSON file, from which they can be imported and postprocessed
 * in other tools like Matlab(R)
 * 
 * Usage:  cd ./examples/ControllerStudyDemo
 *         node --loader ts-node/esm ./ControllerStudyDemo.ts
 * 
 * Or run the "Run controller study demo (JS)" configuration in VS Code 
 *   (which will support debugging).
 */

import * as fs from 'fs'
import Simulator from '../../src/core/Simulator.js'
import VirtualPatientUvaPadova from '../../src/core/models/UvaPadova_T1DMS.js'
import Controller from '../../src/types/Controller.js'
import ControllerBasalBolus from '../../src/core/controllers/BasalBolus.js'
import ControllerOref0 from '../../src/core/controllers/Oref0.js'
import Meal from '../../src/types/Meal.js'
import IdealCGM from '../../src/core/sensors/IdealCGM.js'
import StaticInsulinPump from '../../src/core/actuators/StaticInsulinPump.js'
import ControllerUnion from '../../src/core/ControllerUnion.js'
import MealBolus from '../../src/core/controllers/MealBolus.js'


// define a patient object
const patient = new VirtualPatientUvaPadova()

// define a set of meals
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
    {
        start: new Date("2022-05-01T17:00:00Z"),
        duration: 15,
        carbs: 40,
        announcement: {
            start: new Date("2022-05-01T17:00:00Z"),
            carbs: 40,
            time: new Date("2022-05-01T16:00:00Z"),
        },
    },
    {
        start: new Date("2022-05-02T08:00:00Z"),
        duration: 15,
        carbs: 30,
    },
]

// function for easy call of simulation
function performSimulationWithController(id: string, controller: Controller) {
    controller.autoConfigure?.(patient.getPatientProfile())
    // prepare the simulator
    const sim = new Simulator()
    // prepare simulation
    sim.setPatient(patient)
    sim.setSensor(new IdealCGM())
    sim.setActuator(new StaticInsulinPump())
    sim.setController(controller)
    sim.setMeals(meals)
    sim.setOptions({
        "t0": new Date("2022-05-01T00:00:00Z"),	// start at 0am
        "tmax": new Date("2022-05-03T00:00:00Z"), 	// two days later 
    })
    // run simulation
    sim.runSimulation()
    const results = sim.getSimulationResults()
    return { id, meals, results } // TODO: patient, controller, 
}

/** first controller */
const controller1 = new ControllerBasalBolus({
    premealTime: 30, carbFactor: 0.8	// meal bolus
})

/** second controller: oref0 with meal bolus */
const controller2 = new ControllerUnion([
    new ControllerOref0({
        max_iob: 3.5,
        dia: 6,
        max_daily_basal: 1.3,
        max_basal: 3.5,
        max_bg: 100,
        min_bg: 100,
        sens: 40,
        carb_ratio: 10 / 0.8,
        maxCOB: 120,
    }),
    // meal bolus
    new MealBolus({
        premealTime: 30,
        carbFactor: 0.8,
    })
])

// run simulations
const results = [
    performSimulationWithController("Basal+Bolus", controller1),
    performSimulationWithController("oref0", controller2),
]

// store simulation input and results to JSON file
fs.writeFile("./ControllerStudyResults.json",
    JSON.stringify(results),
    function (err: NodeJS.ErrnoException | null) {
        if (err) {
            throw err
        }
        console.log("Done! Now run ControllerStudyPostprocess.m in Matlab(R)")
    }
)
