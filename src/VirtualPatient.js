/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


// base class of physiological model of virtual patient
class VirtualPatient {
	xeq				// steady state vector (equilibrium)
	IIReq			// equilibrium basal rate

	inputList
	outputList
	paramList
	stateList
	signalList
	
	
	constructor() {
	};
	
	// return initial state
	getInitialState() {
		return {};
	}
	
	// compute derivatives (returns array)
	derivatives(_t, _x, _u) {
		return {};
	};
	
	
	// compute outputs (returns object)
	outputs(_t, _x, _u) {
		return {}
	};
	
}

export default VirtualPatient;

