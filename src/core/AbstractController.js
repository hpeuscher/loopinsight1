/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/
import NotImplementedError from '../common/NotImplementedError.js'


// base class of controller algorithm
class AbstractController {

	// setPatient (called before simulation)
	setPatient(patient) {
		this.patient = patient;
	};

	reset() {
		throw new NotImplementedError(this.constructor.name, 'setup')
	}
	
	// compute insulin demand (function is called every minute)
	update(_t, _y, _x, _announcement) {
		throw new NotImplementedError(this.constructor.name, 'update')
	}
	
	// return current treatment
	//   iir: insulin infusion rate in U/h
	//   ibolus: insulin bolus in U
	getTreatment() {
		throw new NotImplementedError(this.constructor.name, 'getTreatment')
	}
}

export default AbstractController;
