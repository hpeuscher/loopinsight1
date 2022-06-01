/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


import AbstractController from '../AbstractController.js';

class ControllerBasalBolus extends AbstractController {

	constructor() {
		super()
		this.setParameters(1, false, 0, 0)
	}

	setParameters(basalRate, useBolus, preBolusTime, carbFactor) {
		this.IIR = basalRate
		this.useBolus = useBolus
		this.preBolusTime = preBolusTime	// time between meal and bolus
		this.carbFactor = carbFactor		// insulin units per 10g CHO
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
		// compute bolus (IIR remains constant all the time)
		this.bolus = this.useBolus * this.announcedCarbs(t + this.preBolusTime * 60e3) / 10.0
			* this.carbFactor

		return {iir: this.IIR, ibolus: this.bolus}
	}


}

export default ControllerBasalBolus;
