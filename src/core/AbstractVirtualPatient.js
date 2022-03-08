/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/



/**
 * abstract base class of physiological model of virtual patient
 */
class AbstractVirtualPatient {
	xeq				// steady state vector (equilibrium)
	IIReq			// equilibrium basal rate

	inputList
	outputList
	paramList
	stateList
	signalList
	

	// return initial state
	getInitialState() {
		throw new NotImplementedError(this.constructor.name, 'getInitialState')
	}
	
	// compute derivatives (returns array)
	derivatives(_t, _x, _u) {
		throw new NotImplementedError(this.constructor.name, 'derivatives')
	}
	
	
	// compute outputs (returns object)
	outputs(_t, _x, _u) {
		throw new NotImplementedError(this.constructor.name, 'outputs')
	}
	
}

export default AbstractVirtualPatient;

