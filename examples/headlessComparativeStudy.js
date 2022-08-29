/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

// this file illustrates how to use LoopInsighT1 to run simulations without the
// browser-based graphical user interface.
// usage: type "node ./headlessComparativeStudy.js"

import * as fs from 'fs'
import Simulator from '../src/core/Simulator.js'
import ControllerBasalBolus from '../src/core/controllers/BasalBolus.js'
import ControllerOref0 from '../src/core/controllers/Oref0.js'
import VirtualPatientUvaPadova from '../src/core/models/UvaPadova.js'

// This file performs two simulations with identical scenarios but
// different controller algorithms. The results are stored to a
// JSON file from which they can be imported and postprocessed
// in other tools like Matlab(R)

// define a patient object
let patient = new VirtualPatientUvaPadova()
// define a set of meals
let meals = [
	{
		actual: {
			start: new Date("2022-05-01T08:00:00Z"), 
			duration: 15, 
			carbs: 20, 
		},
		announcement: {
			start: new Date("2022-05-01T08:00:00Z"), 
			carbs: 20, 
			time: new Date("2022-05-01T07:00:00Z"), 
		},
	},
	{
		actual: {
			start: new Date("2022-05-01T17:00:00Z"), 
			duration: 15, 
			carbs: 40, 
		},
		announcement: {
			start: new Date("2022-05-01T17:00:00Z"), 
			carbs: 40, 
			time: new Date("2022-05-01T16:00:00Z"), 
		},
	},
	{
		actual: {
			start: new Date("2022-05-02T08:00:00Z"), 
			duration: 15, 
			carbs: 30, 
		},
	},
]

// function for easy call of simulation
function performSimulationWithController(controller) {
	const id = controller.constructor.name
	// prepare the simulator
	var sim = new Simulator()
	// prepare simulation
	sim.setPatient(patient)
	sim.setController(controller)
	sim.setMeals(meals)
	sim.setOptions({
		"t0": 	new Date("2022-05-01T00:00:00Z"),	// start at 0am
		"tmax": new Date("2022-05-03T00:00:00Z"), 	// two days later 
	})
	// run simulation
	sim.runSimulation()
	const results = sim.getSimulationResults()
	return {id, patient, controller, meals, results}
}

// first controller/algorithm
let controller1 = new ControllerBasalBolus()
controller1.setParameters(patient.IIReq, true, 30, 1.5)

// second controller
let controller2 = new ControllerOref0()
controller2.setParameters(
	{
		max_iob: 3.5,
		dia: 6,
		max_daily_basal: 1.3,
		max_basal: 3.5,
		max_bg: 120,
		min_bg: 95,
		sens: 50,
		carb_ratio: 8,
		maxCOB: 120,
	}, 	// oref0 profile information
	true, 30, 1.5) // meal bolus

// run simulations
const results = [
	performSimulationWithController(controller1),
	performSimulationWithController(controller2),
]

// store simulation input and results to JSON file
fs.writeFile("./headlessComparativeStudyResults.json",
	JSON.stringify(results), 
	function(err) {
		if(err) {
			console.log('error: ', err)
		}
		else {
			console.log("Done! Now run headlessComparativeStudyPostprocess.m in Matlab(R)")
		}
	}
)
