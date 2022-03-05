/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

import RK4 from './SolverRK4.js';

class Simulator {
	
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
	
	setPatient(patient) {
		this.patient = patient
	}
	
	setController(controller) {
		this.controller = controller;
	}

	setMeals(meals) {
		this.meals = meals
	}

	setPushData(pushData) {
		this.pushData = pushData
	}

	setOptions(options) {
		this.options = options
	}

	// run simulation
	startSim() {
		
		// initialize controller
		this.controller.setup(this.patient);
		
		// initialize simulation variables
		let t = 0;
		let tmax = this.options.tmax;
		if (!Number.isInteger(tmax) || tmax < 0) {
			tmax = 10;
		}
		
		const dt = 1;
		let x = this.patient.getInitialState();
		let u = {meal: 0, iir: this.patient.IIReq, ibolus: 0};
		let y = this.patient.outputs(t, x, u);
		let log = {};
		
		
		// start simulation
		while (t<tmax)
		{
			// compute controller output
			log = this.controller.update(t, y, x, 
				(t_) => this.announcement(this.meals, t_, t)
			);

			// inputs to metabolic model
			u = this.controller.getTreatment();
			u['iir'] = Math.max(u['iir'] || 0, 0);
			u['ibolus'] = Math.max(u['ibolus'] || 0, 0);
			u['carbs'] = this.carb(this.meals, t);
			u['meal'] = this.newMeal(this.meals, t);

			// output current state to frontend
			if (this.pushData(t, x, u, y, log)) {
				// abort simulation
				return;
			}
			
			// proceed one time step
			x = RK4((t_,x_) => this.patient.derivatives(t_, x_, u), t, x, dt);
			y = this.patient.outputs(t, x, u);
			t += dt;
		}
	}
}

export default Simulator;
