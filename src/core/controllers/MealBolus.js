/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


export default class ControllerMealBolus {

	constructor({carbFactor = 1, preBolusTime = 30, active = true}) {
		this.carbFactor = carbFactor		// carb factor in U/(10g CHO)
		this.preBolusTime = preBolusTime	// pre-bolus interval in minutes
		this.active = active
	}

	/**
	 * Set a callback that determines the amount of announced
	 * carbs at a specific point in time.
	 * 
	 * @param {announcedCarbs} announcedCarbs 
	 */
	setAnnouncedCarbs(announcedCarbs) {
		this.announcedCarbs = announcedCarbs
	}

	// reset before new simulation
	reset() {
	}

	// obtain information about patient
	setPatient(patient) {
		// todo: extract carb factor?
	}

	/**
	 * compute treatment
	 * 
	 * @param {number} t - simulation time as primitive value of a Date object (in ms)
	 * @param {number} y - TODO
	 * @param {number} _x - TODO
	 * @returns {object} - TODO
	 */
	computeTreatment(t, _y, _x) {
		// compute bolus
		const ibolus = this.active * this.announcedCarbs(t + this.preBolusTime * 60e3) / 10.0
			* this.carbFactor

		return {ibolus}
	}

}
