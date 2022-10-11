/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

import ControllerMealBolus from './MealBolus.js'

class ControllerBasalBolus extends ControllerMealBolus {

	constructor({basalRate = 1}) {
		super(...arguments)			// meal bolus
		this.basalRate = basalRate	// basal rate in U/h
	}

	// reset before new simulation
	reset() {
		// nothing to do
	}

	/**
	 * computes insulin demand
	 * 
	 * @param {number} t - TODO
	 * @param {number} y - TODO
	 * @param {number} _x - TODO
	 * @returns {{iir: number, ibolus: number, logData: Object}} - TODO
	 */
	 computeTreatment(t, _y, _x) {
		// compute meal bolus
		const mealBolus = super.computeTreatment(t, _y, _x)

		return {ibolus: mealBolus.ibolus, iir: this.basalRate}
	}
}

export default ControllerBasalBolus;
