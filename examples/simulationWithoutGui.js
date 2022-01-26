/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

// this file illustrates how to use LoopInsighT1 to run simulations without the
// browser-based graphical user interface.

import Simulator from '../src/Simulator.js';
import ControllerBasalBolus from '../src/ControllerBasalBolus.js';
import VirtualPatientUvaPadova from '../src/VirtualPatientUvaPadova.js';

// define a patient object
let patient = new VirtualPatientUvaPadova();
// define a controller/algorithm
let controller = new ControllerBasalBolus();
controller.setParams(patient.IIReq, true, 30, 1.5);
// define a set of meals
let meals = [
	{
		actual: {
			start: 60, 
			duration: 15, 
			carbs: 20, 
		},
		announcement: {
			start: 60, 
			carbs: 20, 
			time: 0,
		},
	},
];

// prepare the simulator
var sim = new Simulator();

// this is where to store the results
var results = [];

// start the simulation
sim.startSim(
	patient, 
	controller, 
	meals, 
	(t, _x, _u, y, _log) => { results.push({t:t, G:y.G}); },
	{"tmax": 600}
);

// display the results (or preprocess them as you need)
console.log(results);
