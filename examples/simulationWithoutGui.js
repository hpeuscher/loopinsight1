/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

// this file illustrates how to use LoopInsighT1 to run simulations without the
// browser-based graphical user interface.

import Simulator from '../src/core/Simulator.js'
import ControllerBasalBolus from '../src/core/controllers/BasalBolus.js'
import VirtualPatientUvaPadova from '../src/core/models/UvaPadova.js'

// define a patient object
let patient = new VirtualPatientUvaPadova()
// define a controller/algorithm
let controller = new ControllerBasalBolus()
controller.setParameters(patient.IIReq, true, 30, 1.5)
// define a set of meals
let meals = [
	{
		actual: {
			start: new Date(2022,5,1,8,0,0), 
			duration: 15, 
			carbs: 20, 
		},
		announcement: {
			start: new Date(2022,5,1,8,0,0), 
			carbs: 20, 
			time: new Date(2022,5,1,7,0,0),
		},
	},
]

// prepare the simulator
var sim = new Simulator()

// start the simulation
sim.setPatient(patient)
sim.setController(controller)
sim.setMeals(meals)
sim.setOptions({
	"t0": new Date(2022,5,1,6,0,0),
	"tmax": new Date(2022,5,1,18,0,0),
})

sim.runSimulation()
const results = sim.getSimulationResults()

// display the results (or preprocess them as you need)
console.log(results)
