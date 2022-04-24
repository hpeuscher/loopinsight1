/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

import NotImplementedError from "../common/NotImplementedError.js"

/**
 * abstract base class of physiological model of virtual patient
 */
class AbstractVirtualPatient {
	IIReq			// equilibrium basal rate

	inputList		// list of inputs used by this model
	outputList		// list of outputs provided by this model
	parameterList	// list of model parameters
	stateList		// list of state variables
	signalList		// list of intermediate signals
	

	// return initial state
	getInitialState() {
		throw new NotImplementedError(this.constructor.name, 'getInitialState')
	}
	
	// compute derivatives (returns array)
	// u["carbs"]: carbs intake in g/min
	// u["iir"]: subcutaneous insulin injection in U/h
	// u["ibolus"]: bolus in U administered in this minute
	getDerivatives(_t, _x, _u) {
		throw new NotImplementedError(this.constructor.name, 'getDerivatives')
	}
	
	// compute outputs (returns object)
	getOutputs(_t, _x, _u) {
		throw new NotImplementedError(this.constructor.name, 'getOutputs')
	}
	
}

export default AbstractVirtualPatient;

