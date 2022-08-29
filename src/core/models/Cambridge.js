/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/



import AbstractVirtualPatient from '../AbstractVirtualPatient.js';


const pmol_per_U = 6000;
const mmolG2mg = 180.16;


// physiological model of virtual patient
class VirtualPatientCambridge extends AbstractVirtualPatient {
	
	constructor(parameters) {
		super(parameters);
		
		// list of inputs used by this model
		this.inputList = ["meal", "IIR", "bolus"]
		
		// list of outputs provided by this model
		this.outputList = ["G"]
		
		// list of derived quantities
		this.signalList = [];
		
		// default parameters
		this.defaultParameters = {
			"Gpeq"	: 6,		// mmol/L
			"BW"	: 75,		// kg
			"k12"	: 0.066,	// 1/min
			"ka1" 	: 0.006,	// 1/min
			"ka2" 	: 0.06,		// 1/min
			"ka3" 	: 0.03,		// 1/min
			"ke" 	: 0.138,	// 1/min
			"VI" 	: 0.12,		// L/kg
			"VG"	: 0.16,		// L/kg
			"AG"	: 0.8,		// 1
			"tmaxG"	: 40,		// min
			"SIT" 	: 51.2e-4,	// 1/min/mU/L
			"SID" 	: 8.2e-4,	// 1/min/mU/L
			"SIE" 	: 520e-4,	// 1/mU/L
			"EGP0"	: 0.0161,	// mmol/kg/min
			"F01"	: 0.0097,	// mmol/kg/min
			"tmaxI"	: 55,		// min
		};
		
		// load parameters handed over to this instance
		if (typeof parameters === "undefined") {
			parameters = {}
		}
		this.parameters = Object.assign(parameters, this.defaultParameters)

		// extract full list of parameters
		this.parameterList = Object.keys(this.defaultParameters)

		// compute equilibrium
		this.computeSteadyState()

		// list of state variables
		this.stateList = Object.keys(this.xeq)
	};
	
	// set or change parameters
	setParameters(parameters) {
		// import parameters
		for (const key in parameters) {
			this.parameters[key] = parameters[key];
		}
		this.computeSteadyState();
	}
	
	// compute equilibrium
	computeSteadyState() {
		const params = this.parameters
		
		const Q1eq = params.Gpeq * params.VG * params.BW
		const F01eq = params.F01 * params.BW * Math.min(params.Gpeq / 4.5, 1)
		const EGP0 = params.EGP0 * params.BW

		const c = -F01eq*params.k12 + EGP0*params.k12
		const b = -F01eq*params.SID - params.k12*Q1eq*params.SIT + params.k12*params.SIT*Q1eq + EGP0*params.SID - EGP0*params.k12*params.SIE
		const a = -Q1eq * params.SIT * params.SID - EGP0*params.SID*params.SIE
		const Ieq = (-b - Math.sqrt(b*b - 4*a*c)) / 2 / a

		const x1eq = params.SIT * Ieq
		const x2eq = params.SID * Ieq
		const x3eq = params.SIE * Ieq
		const Seq = params.tmaxI * (params.VI*params.BW) * params.ke *Ieq
		const Q2eq = Q1eq*x1eq/(params.k12+x2eq)

		this.xeq = {
			"Q1": Q1eq,		// mass in accessible compartment (plasma) in mmol
			"Q2": Q2eq,		// mass in non-accessible compartment in mmol
			"S1": Seq,		// amount of insulin in compartment 1 in mU
			"S2": Seq,		// amount of insulin in compartment 2 in mU
			"I":  Ieq,		// plasma insulin in mU/L
			"x1": x1eq,		// insulin action on glucose transport in 1/min
			"x2": x2eq,		// insulin action on glucose disposal in 1/min
			"x3": x3eq,		// insulin action on endogenous glucose production in 1
			"D1": 0,		// glucose in compartment 1 in mmol
			"D2": 0,		// glucose in compartment 2 in mmol
		};

		this.IIReq = Seq / params.tmaxI / 1000 * 60	// U/h
		//console.log("IIReq = " + this.IIReq)
		//console.log(this.xeq)
		
		// verify equilibrium
		//console.log(this.getDerivatives(0, this.xeq, {carbs: 0, iir: this.IIReq, ibolus: 0}))
	}
	
	getInitialState() {
		return this.xeq;
	}
	
	getDerivatives(_t, x, u) {
		
		const params = this.parameters;
		
		// inputs
		const M = u["carbs"] / mmolG2mg * 1000;	// meal ingestion in mmol/min
		const IIR = u["iir"] * 1000 / 60;			// insulin infusion rate in mU/min
		const bolus = u["ibolus"] * 1000;			// insulin bolus in mU
		
		
		// plasma glucose concentration
		const G = x["Q1"] / (params.VG * params.BW); // in mmol/L

		// total non-insulin-dependent glucose ﬂux corrected for the ambient glucose concentration in mmol/min
		const F01c =  params.F01 * params.BW * Math.min(G / 4.5, 1);

		// renal glucose clearance
		const FR = Math.max(0, 0.003*(G - 9));
		
		// gut absorption rate
		const UG = x["D2"] / params.tmaxG;

		// declare vector of derivatives dx/dt
		let dx_dt = {};
		
		// insulin subsystem
		// amount of insulin in compartment 1 in mU
		dx_dt["S1"] = - x["S1"] / params.tmaxI + (IIR + bolus);
		// amount of insulin in compartment 2 in mU
		dx_dt["S2"] = (x["S1"] - x["S2"]) / params.tmaxI;
		
		// mass in accessible compartment (plasma) in mmol
		dx_dt["Q1"] = - F01c - x["x1"]*x["Q1"] + params.k12*x["Q2"] 
					  - FR + UG + params.EGP0 * params.BW*(1-x["x3"]);
		
		// mass in non-accessible compartment in mmol
		dx_dt["Q2"] = x["x1"]*x["Q1"] - (params.k12+x["x2"])*x["Q2"];

		// plasma insulin in mU/L
		dx_dt["I"] = x["S2"] / params.tmaxI / (params.VI*params.BW) - params.ke*x["I"];
		
		// insulin/glucose distribution/transport
		const kb1 = params.ka1 * params.SIT; // in 1/min^2/(mU/L)
		dx_dt["x1"] = -params.ka1*x["x1"] + kb1*x["I"];
		
		// glucose disposal
		const kb2 = params.ka2 * params.SID; // in 1/min^2/(mU/L)
		dx_dt["x2"] = -params.ka2*x["x2"] + kb2*x["I"];
		
		// endogenous glucose production in 1/min/(mU/L)
		const kb3 = params.ka3 * params.SIE;
		dx_dt["x3"] = -params.ka3*x["x3"] + kb3*x["I"];
		
		// meal subsystem
		// glucose in compartment 1 in mmol
		dx_dt["D1"] = - x["D1"] / params.tmaxG + M * params["AG"];
		// glucose in compartment 2 in mmol
		dx_dt["D2"] = (x["D1"] - x["D2"]) / params.tmaxG;

		return dx_dt;
	};
	
	
	// compute outputs
	getOutputs(_, x, _u) {
		return {
			"Gp": x["Q1"] / (this.parameters.VG * this.parameters.BW) * mmolG2mg / 10,	// in mg/dL
		}
	};
	
}

export default VirtualPatientCambridge;
