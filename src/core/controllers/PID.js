/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

import ControllerMealBolus from './MealBolus.js'

class ControllerPID extends ControllerMealBolus {

	constructor({defaultBasalRate = 1, kP = 1, kI = 0.01, kD = 0, targetBG = 100}) {
		super(...arguments)			// meal bolus
		this.defaultBasalRate = defaultBasalRate
		this.kP = kP
		this.kI = kI
		this.kD = kD
		this.target = targetBG
		this.reset()
	}

	// reset before new simulation
	reset() {
		this.e_int = 0
		this.e_old = undefined
	}

	/**
	 * computes insulin demand
	 * 
	 * @param {number} t - TODO
	 * @param {number} y - TODO
	 * @param {number} _x - TODO
	 * @returns {{iir: number, ibolus: number, logData: Object}} - TODO
	 */
	 computeTreatment(t, y, _x) {

		// compute meal bolus
		const mealBolus = super.computeTreatment(t, y, _x)

		// PID law
		let e = this.target - y.G
		this.e_int += e / 60

		let iir = this.defaultBasalRate - this.kP * e - this.kI * this.e_int
		if (typeof this.e_old !== "undefined") {
			iir -= this.kD * (e - this.e_old) * 60
		}
		this.e_old = e

		return {...mealBolus, iir}
	}



}

export default ControllerPID;
