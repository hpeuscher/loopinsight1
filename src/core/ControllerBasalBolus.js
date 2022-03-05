/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


import AbstractController from './AbstractController.js';

class ControllerBasalBolus extends AbstractController {
		
	constructor() {
		super()
		this.setParams(1, false, 0, 0); 
	};
	
	setParams(basalRate, useBolus, PreBolusTime, CarbFactor) {
		this.IIR = basalRate;
		this.useBolus = useBolus;
		this.PreBolusTime = PreBolusTime;	// time between meal and bolus
		this.CarbFactor = CarbFactor;		// insulin units per 10g CHO
	}
	
	// reset before new simulation
	setup(patient) {
		this.setPatient(patient);
	}
	
	// compute insulin demand
	update(t, _y, _x, announcement) {
		// compute bolus (IIR remains constant all the time)
		this.bolus = this.useBolus * announcement(t+this.PreBolusTime) / 10.0 
			* this.CarbFactor;
		
		return {};
	};
	
	// return current treatment
	getTreatment() {
		return {
			iir: this.IIR,
			ibolus: this.bolus,
		};
	};
	
}

export default ControllerBasalBolus;
