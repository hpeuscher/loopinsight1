/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

import RK4 from './SolverRK4.js';

class Simulator {
	constructor() {
	}
	
	// compute momentary carb intake
	carb(meals, t) {
		let m = 0;
		for (let i=0; i<meals.length; i++) {
			let meal = meals[i];
			m += (t>=meal.actual.start) * 
				 (t<meal.actual.start+meal.actual.duration) * 
				 meal.actual.carbs / Math.max(1,meal.actual.duration);
		}
		return m;
	}

	// determine whether a new meal starts at time t
	newMeal(meals, t) {
		let m = 0;
		for (let i=0; i<meals.length; i++) {
			m = m + (meals[i].actual.start==t)*meals[i].actual.carbs; 
		}
		if (m) {
			return m;	// yes -> return total meal
		} else {
			return NaN;	// no
		}
	}
	
	// compute meal announcement
	//   meals: array of announced meals
	//   treq: requested time of interest
	//   tsim: simulation time
	announcement(meals, treq, tsim) {
		let a = 0;
		for (let i=0; i<meals.length; i++) {
			if (typeof meals[i].announcement !== "undefined") {
				a = a + (tsim>=meals[i].announcement.time)
						* (meals[i].announcement.start==treq)
						* meals[i].announcement.carbs;
			}
		}
		return a;
	}
	
	// run simulation
	startSim(patient, controller, meals, pushData, options) {
		
		// initialize controller
		controller.setup(patient);
		
		// initialize simulation variables
		let t = 0;
		let tmax = options.tmax;
		if (!Number.isInteger(tmax) || tmax < 0) {
			tmax = 10;
		}
		
		const dt = 1;
		let x = patient.getInitialState();
		let u = {meal: 0, IIR: patient.IIReq, bolus: 0};
		let y = patient.outputs(t, x, u);
		let log = {};
		
		
		// start simulation
		while (t<tmax)
		{
			// compute controller output
			log = controller.update(t, y, x, 
				(t_) => this.announcement(meals, t_, t)
			);

			// inputs to metabolic model
			u = controller.getTreatment();
			u['carbs'] = this.carb(meals, t);
			u['meal'] = this.newMeal(meals, t);

			// output current state to frontend
			if (pushData(t, patient.stateToObject(x), u, y, log)) {
				// abort simulation
				return;
			}
			
			// proceed one time step
			x = RK4((t_,x_) => patient.derivatives(t_, x_, u), t, x, dt);
			y = patient.outputs(t, x, u);
			t += dt;
		}
	}
}

export default Simulator;
