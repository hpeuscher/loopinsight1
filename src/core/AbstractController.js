/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/
import NotImplementedError from '../common/NotImplementedError.js'


// base class of controller algorithm
class AbstractController {

	/**
	 * sets the virtual patient
	 * @param {Object} patient 
	 */
	setPatient(patient) {
		this.patient = patient
	}

	/**
	 * Callback for computing the amount of announced
	 * carbs at a specific point in time.
	 * 
	 * @callback announcedCarbs 
	 * @param {number} t - the time of interest
	 * @returns {number}
	 */
	/**
	 * Set a callback that determines the amount of announced
	 * carbs at a specific point in time.
	 * 
	 * @param {announcedCarbs} announcedCarbs 
	 */
	setAnnouncedCarbs(announcedCarbs) {
		this.announcedCarbs = announcedCarbs
	}

	reset() {
		throw new NotImplementedError(this.constructor.name, 'reset')
	}
	
	/**
	 * computes insulin demand
	 * 
	 * @param {number} t - TODO
	 * @param {number} y - TODO
	 * @param {number} _x - TODO
	 * @returns {{iir: number, ibolus: number, logData: Object}} - TODO
	 */
	computeTreatment(_t, _y, _x) {
		throw new NotImplementedError(this.constructor.name, 'update')
	}
}

export default AbstractController;
