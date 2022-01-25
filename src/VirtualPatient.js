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
	
	
	
	// compute derivatives (returns array)
	derivatives(_t, _x, _u) {
		return [];
	};
	
	
	// compute outputs (returns object)
	outputs(_t, _x, _u) {
		return {}
	};
	
	
	// output state as array
	stateToArray(x) {
		if (Array.isArray(x)) {
			return x;
		}
		let a = [];
		for (const id of Object.keys(this.stateList)) {
			a.push(x[id]);
		}
		return a;
	};
	
	
	// output state as object
	stateToObject(a) {
		if (! Array.isArray(a)) {
			return a;
		}
		let keys = Object.keys(this.stateList);
		let x = {};
		for (let i=0; i<a.length; i++) {
			// todo
			x[keys[i]] = a[i];
		}
		return x;
	};
	
}

export default VirtualPatient;

