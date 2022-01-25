/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/



// base class of controller algorithm
class Controller {

	constructor() {
	};

	// setup (called before simulation)
	setup(patient) {
		this.patient = patient;
	};
	
	// compute insulin demand (function is called every minute)
	update(_t, _y, _x, _announcement) {
	};
	
	// return current treatment
	//   iir: insulin infusion rate in U/h
	//   ibolus: insulin bolus in U
	getTreatment() {
		return {};
	}
}

export default Controller;
