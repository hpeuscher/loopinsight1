/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * This file performs a comparative in silico study regarding exercise models.
 * 
 * Usage:  cd ./examples/ExerciseModelsComparison
 *         node --loader ts-node/esm ./ExerciseModelsComparison.ts
 */

import * as fs from 'fs'
import Simulator from '../../src/core/Simulator.js'
import ControllerBasalBolus from '../../src/core/controllers/BasalBolus.js'
import IdealCGM from '../../src/core/sensors/IdealCGM.js'
import StaticInsulinPump from '../../src/core/actuators/StaticInsulinPump.js'
import Patient from '../../src/types/Patient.js'
import RoyParker2007 from '../../src/core/models/RoyParker2007.js'
import CambridgeJacobs2015 from '../../src/core/models/CambridgeJacobs2015.js'
import Deichmann2021 from '../../src/core/models/Deichmann2021.js'


// define an exercise unit
const exerciseUnits = [
	{
	start: new Date("2022-05-01T15:00:00Z"),
	duration: 60,
	intensity: 20,
	}
]

// function for easy call of simulation
function performSimulationWithModel(patient: Patient): object {
	const id = patient.getModelInfo().id
	// prepare the simulator
	const sim = new Simulator()
	// prepare simulation
	sim.setPatient(patient)
	sim.setSensor(new IdealCGM())
	sim.setActuator(new StaticInsulinPump({inc_basal: 0, inc_bolus: 0}))
	// define controller
	const controller = new ControllerBasalBolus({
        inc_basal: 0, // do not round basal rate for comparable homeostasis
		premealTime: 15, carbFactor: 1/1.5	// meal bolus
	})
    controller.autoConfigure(patient.getPatientProfile())
	sim.setController(controller)
	sim.setExerciseUnits(exerciseUnits)
	sim.setOptions({
		"t0": 	new Date("2022-05-01T00:00:00Z"),
		"tmax": new Date("2022-05-02T24:00:00Z"),
	})
	// run simulation
	sim.runSimulation()
	const results = sim.getSimulationResults()
	return {id, results}
}

// prepare object for results
const results: Array<object> = []

// list of models to include in study
const modelList = [RoyParker2007, CambridgeJacobs2015, Deichmann2021]

for (const model of modelList) {
	try {
		// create virtual patient with uniform basal blood glucose of 120mg/dl
		const patient = new model({Gpeq: 120})
        const result = performSimulationWithModel(patient)
		results.push(result)
		console.log("ok")
	}
	catch (e) {
		console.error(e)
	}
}

// store simulation input and results to JSON file
fs.writeFile("./ExerciseModelsComparison.json",
	JSON.stringify(results), 
    function (err) {
        if (err) {
            throw err
        }
        console.log("Done! Now run preprocessing.")
    }
)
