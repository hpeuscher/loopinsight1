/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

import InvalidResultError from '../common/InvalidResultError.js'
import RK4 from './SolverRK4.js'

const Min2Milli = 6e4

class Simulator {

	constructor() {
		this.simulationResults = []
		this.meals = []
		this.exercises = []
	}

	getSimulationResults() {
		return this.simulationResults
	}

	setPatient(patient) {
		this.patient = patient
	}

	setController(controller) {
		this.controller = controller
	}

	setMeals(meals) {
		this.meals = []
		for (let meal of meals) {
			if (typeof meal.actual !== "undefined") {
				if (typeof meal.actual.start !== "undefined") {
					meal.actual.start = new Date(meal.actual.start)
				}
			}
			if (typeof meal.announcement !== "undefined") {
				if (typeof meal.announcement.start !== "undefined") {
					meal.announcement.start = new Date(meal.announcement.start)
				}
				if (typeof meal.announcement.time !== "undefined") {
					meal.announcement.time = new Date(meal.announcement.time)
				}
			}
			this.meals.push(meal)
		}
	}

	setExerciseUnits(exercises) {
		this.exercises = []
		for (let exercise of exercises) {
			exercise.start = new Date(exercise.start)
			this.exercises.push(exercise)
		}
	}

	setOptions(options) {
		this.options = options
	}


	runSimulation() {

		// fixed time step
		const dt = 1

		// reset simulationResults
		this.simulationResults = []

		// initialize controller
		this.controller.setPatient(this.patient)
		this.controller.setAnnouncedCarbs((t_) => this._announcedCarbs(this.meals, t_, t))
		this.controller.reset()

		// initial time of simulation
		let t = this.options.t0
		if (Object.prototype.toString.call(t) !== '[object Date]') {
			t = new Date()
		}
		t = t.valueOf()
		
		// stop time of simulation
		let tmax = this.options.tmax
		if (Object.prototype.toString.call(tmax) !== '[object Date]') {
			tmax = t + 60*Min2Milli
		}

		// initialize simulation variables
		let x = this.patient.getInitialState()
		let u = { meal: 0, iir: this.patient.IIReq, ibolus: 0, intensity: 0 }	// todo: complete list
		let y = this.patient.getOutputs(t, x, u)

		// start simulation
		while (t <= tmax) {
			// todo: sensor dynamics
			y["G"] = y["Gp"];

			// validity check
			if (isNaN(y["G"])) {
				throw new InvalidResultError(t, y, x)
			}

			// compute controller output
			let { logData, iir, ibolus } = this.controller.computeTreatment(t, y, x)
			if (iir < 0 || typeof iir === "undefined") iir = 0
			if (ibolus < 0 || typeof ibolus === "undefined") ibolus = 0

			// store results
			const carbs = this._momentaryCarbIntake(this.meals, new Date(t))
			const isMeal = this._newMealStartingAt(this.meals, new Date(t))
			const intensity = this._momentaryExerciseIntensity(this.exercises, new Date(t))
			u = { iir, ibolus, carbs, meal: isMeal, intensity }
			this.simulationResults.push({t: new Date(t), x, u, y, logData})

			// proceed one time step
			x = RK4((t_, x_) => this.patient.getDerivatives(t_, x_, u), t, x, dt)
			y = this.patient.getOutputs(t, x, u)
			t += dt*Min2Milli
		}

		return this.simulationResults
	}

	/**
	 * Computes momentary carb intake
	 * 
	 * @param {array} meals - An array of announced meals
	 * @param {number} t - The current time
	 * @returns {number} the current carb intake
	 */
	_momentaryCarbIntake(meals, t) {
		let m = 0;
		for (const meal of meals) {
			const { start, duration, carbs } = meal.actual
			const tend = new Date(start.valueOf() + duration*60000)
			if (t >= start && t < tend) {
				if (duration < 1) {
					duration = 1
				}
				m += carbs / duration
			}
		}
		return m
	}

	/**
	* Computes momentary exercise intensity
	 * 
	 * @param {array} exercises - An array of exercise units
	 * @param {number} t - The current time
	 * @returns {number} the current exercise intensity
	 */
	_momentaryExerciseIntensity(exercises, t) {
		let intensity = 0;
		for (const exercise of exercises) {
			const tend = new Date(exercise.start.valueOf() + exercise.duration*60000)
			if (t >= exercise.start && t < tend) {
				intensity = exercise.intensity
			}
		}
		return intensity
	}

	/**
	 * determines whether a new meal starts at time t
	 * @param {array}  meals - an array of announced meals
	 * @param {number} t - the time of interest
	 * @returns {number}
	 */
	_newMealStartingAt(meals, t) {
		let m = 0;
		for (const meal of meals) {
			const { start, carbs } = meal.actual
			if (start.getTime() === t.getTime() && carbs > 0) {
				return carbs
			}
		}
		return NaN;
	}


	/** 
	 * computes announced carbs:
	 * @param {array} meal - Array of announced meals
	 * @param {number} treq - requested time of interest
	 * @param {number} tsim - current simulation time
	 * @returns {number} Sum of announced carbs
	 */
	_announcedCarbs(meals, tReq, tSim) {
		let a = 0;
		for (const meal of meals) {
			if (!meal.announcement) continue
			const { start, carbs, time } = meal.announcement
			if (tSim >= time.getTime() && start.getTime() === tReq) {
				a += carbs
			}
		}

		return a
	}

}

export default Simulator;
