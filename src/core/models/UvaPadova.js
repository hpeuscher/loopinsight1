/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

/*
The model implemented in this file uses information from the following scientific sources:

[Dalla Man, IEEE TBME, 2006]
	Dalla Man, Ch.; Camilleri, M.; Cobelli, C.
	"A System Model of Oral Glucose Absorption: Validation on Gold Standard Data"
	IEEE Transactions on Biomedical Engineering, Volume 53, Number 12, December 2006

[Dalla Man, JDST, 2007]
	Dalla Man, Ch.; Raimondo, D.M.; Rizza, R. A.; Cobelli, C.
	"GIM, Simulation Software of Meal Glucose-Insulin Model." 
	Journal of Diabetes Science and Technology, Volume 1, Issue 3, May 2007

[Dalla Man, IEEE TBME, 2007]
	Dalla Man, Ch.; Camilleri, M.; Cobelli, C.
	"Meal Simulation Model of the Glucose-Insulin System"
	IEEE Transactions on Biomedical Engineering, Volume 54, Number 10, October 2007

[Dalla Man, JDST, 2014]
	Dalla Man, Ch. et al.
	"The UVA/PADOVA Type 1 Diabetes Simulator: New Features"
	Journal of Diabetes Science and Technology, Volume 8, Issue 1, 2014

*/

import AbstractVirtualPatient from '../AbstractVirtualPatient.js';


const pmol_per_U = 6000;

// physiological model of virtual patient
class VirtualPatientUvaPadova extends AbstractVirtualPatient {
	
	constructor(parameters) {
		super(parameters);
		
		// list of inputs used by this model
		this.inputList = ["meal", "iir", "ibolus"]
		
		// list of outputs provided by this model
		this.outputList = ["G"]
		
		// list of intermediate signals
		this.signalList = ["RaI", "E", "EGP", "Uid", "Uii", "I", "Qsto", "Ra", "S", "HE", "m3"]
		
		// default parameters
		this.defaultParameters = {
			"BW"	: 75,
			"Gpeq"	: 180,
			"VG" 	: 1.88,			// [Dalla Man, IEEE TBME, 2007]
			"k1" 	: 0.065,		// [Dalla Man, IEEE TBME, 2007]
			"k2" 	: 0.079,		// [Dalla Man, IEEE TBME, 2007]
			"VI" 	: 0.05,			// [Dalla Man, IEEE TBME, 2007]
			"m1" 	: 0.190,		// [Dalla Man, IEEE TBME, 2007]
			"m2" 	: 0.484,		// [Dalla Man, IEEE TBME, 2007]
			"m4" 	: 0.194,		// [Dalla Man, IEEE TBME, 2007]
			"m5" 	: 0.0304,		// [Dalla Man, IEEE TBME, 2007]
			"m6"	: 0.6471,		// [Dalla Man, IEEE TBME, 2007]
			"HEeq" 	: 0.6,			// [Dalla Man, IEEE TBME, 2007]
			"kmax" 	: 0.0558,		// [Dalla Man, IEEE TBME, 2007]
			"kmin" 	: 0.0080,		// [Dalla Man, IEEE TBME, 2007]
			"kabs" 	: 0.057,		// [Dalla Man, IEEE TBME, 2007]
			"kgri" 	: 0.0558,		// [Dalla Man, IEEE TBME, 2007]
			"f" 	: 0.90,			// [Dalla Man, IEEE TBME, 2007]
			"kp1" 	: 2.7,			// [Dalla Man, IEEE TBME, 2007]
			"kp2" 	: 0.0021,		// [Dalla Man, IEEE TBME, 2007]
			"kp3"	: 0.009,		// [Dalla Man, IEEE TBME, 2007]
			"kp4"	: 0.0618,		// [Dalla Man, IEEE TBME, 2007]
			"ki"	: 0.0079,		// [Dalla Man, IEEE TBME, 2007]
			"Fcns"	: 1,			// [Dalla Man, IEEE TBME, 2007]
			"Vm0"	: 2.5,			// [Dalla Man, IEEE TBME, 2007]
			"Vmx"	: 0.047,		// [Dalla Man, IEEE TBME, 2007]
			"Km0"	: 225.59,		// [Dalla Man, IEEE TBME, 2007]
			"p2u"	: 0.0331,		// [Dalla Man, IEEE TBME, 2007]
			"ke1"	: 0.0005,		// [Dalla Man, IEEE TBME, 2007]
			"ke2"	: 339,			// [Dalla Man, IEEE TBME, 2007]
			"ka1"	: 0.0018,		// [Dalla Man, JDST, 2007]
			"ka2"	: 0.0182,		// [Dalla Man, JDST, 2007]
			"kd" 	: 0.0164,		// [Dalla Man, JDST, 2007]
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
		const params = this.parameters;
		
		// tissue glucose concentration
		const D = Math.pow(params.Vm0-params.k1*params.Gpeq+params.Km0*params.k2,2) 
				+ 4*params.k2*params.Km0*params.k1*params.Gpeq;
		const Gteq = (-params.Vm0 + params.k1*params.Gpeq - params.Km0*params.k2 
				+ Math.sqrt(D)) / 2 / params.k2;
		const EGPeq = params.Fcns + params.k1*params.Gpeq - params.k2*Gteq;
		const XLeq = (params.kp1 - params.kp2*params.Gpeq - EGPeq) / params.kp3;
		const Ipb = XLeq * params.VI;
		const m3eq = params.HEeq * params.m1 / (1 - params.HEeq);
		const Ilb = Ipb * params.m2 / (params.m1 + m3eq);
		const Raieq = (params.m2+params.m4)*Ipb - params.m1*Ilb;
		const Isceq = solve2x2LSE(
							[[params.ka1, params.ka2], 
							 [params.kd, -params.ka2]], 
							[Raieq, 0]);
		const Isc1eq = Isceq[0];
		const Isc2eq = Isceq[1];
		
		this.IIReq = Isc1eq * (params.kd + params.ka1) * params.BW 
				* 60 / pmol_per_U;	// pmol/min  -> U/h
		
		this.xeq = {
			"Gp": params.Gpeq,
			"Gt": Gteq,
			"Ip": Ipb,
			"Il": Ilb,
			"Qsto1": 0,
			"Qsto2": 0,
			"Qgut": 0,
			"XL": XLeq,
			"I_": XLeq,
			"X": 0,
			"Isc1": Isc1eq,
			"Isc2": Isc2eq,
		};
		
		// verify equilibrium
		// console.log(this.derivatives(0, this.xeq, {carbs: 0, iir: this.IIReq, ibolus: 0}));
		
		// todo: Ipb and Ilb are not accurate
	}
	
	getInitialState() {
		return this.xeq;
	}
	
	getDerivatives(_t, x, u) {
		
		const params = this.parameters;
		
		// inputs
		const M = u["carbs"]*1000;				// meal ingestion in mg/min
		const IIR = u["iir"] * pmol_per_U / 60;	// insulin infusion rate in pmol/min
		const bolus = u["ibolus"] * pmol_per_U;	// insulin bolus in pmol
		
		
		// plasma glucose concentration // [Dalla Man, JDST, 2014] (A1), [Dalla Man, IEEE TBME, 2007] (1)
		const G = x.Gp / params.VG; // in mg/dL
		
		// insulin-dependent glucose utilization // [Dalla Man, IEEE TBME, 2007] (15), special case of risk=0 according to [Dalla Man, JDST, 2014] (A10)
		const Uid = (params.Vm0 + params.Vmx*x["X"]) * x["Gt"] / (params.Km0 + x["Gt"]);	// in mg/kg/min
		
		// insulin-independent glucose utilization	// [Dalla Man, JDST, 2014] (A9), [Dalla Man, IEEE TBME, 2007] (14)
		const Uii = params.Fcns; // in mg/kg/min
		
		// plasma insulin concentration // [Dalla Man, JDST, 2014] (A2), [Dalla Man, IEEE TBME, 2007] (3)
		const I = x["Ip"] / params.VI; // in pmol/L
		
		// amount of glucose in the stomach // [Dalla Man, JDST, 2014] (A3), [Dalla Man, IEEE TBME, 2007] (13)
		const Qsto = x["Qsto1"] + x["Qsto2"]; // in mg
		
		// appearance rate of glucose in plasma // [Dalla Man, JDST, 2014] (A3), [Dalla Man, IEEE TBME, 2007] (13)
		const Ra = params.f * params.kabs * x["Qgut"] / params.BW; // in mg/kg/min
		
		// endogenous glucose production // [Dalla Man, JDST, 2014] (A5), [Dalla Man, IEEE TBME, 2007] (10) (Ipo = 0)
		const EGP = Math.max(0, params.kp1 - params.kp2*x.Gp - params.kp3*x["XL"]); // in mg/kg/min
		
		// renal glucose excretion // [Dalla Man, JDST, 2014] (A14), [Dalla Man, IEEE TBME, 2007] (27)
		const E = Math.max(params.ke1*(x["Gp"] - params.ke2), 0); // in mg/kg/min
		
		// insulin appearance rate // [Dalla Man, JDST, 2014] (A15)
		const Rai = params.ka1*x["Isc1"] + params.ka2*x["Isc2"]; // in pmol/kg/min
		
		// insulin secretion // [Dalla Man, IEEE TBME, 2007] (8)
		const m3eq = params.HEeq * params.m1 / (1 - params.HEeq);
		const S = m3eq * x["Il"] + params.m4*x["Ip"]; // in pmol/kg/min
		// hepatic extraction // [Dalla Man, IEEE TBME, 2007] (4)
		// HE is truncated between 0 and 0.9 to avoid singularity
		const HE = Math.min(0.9, Math.max(0, -params.m5 * S + params.m6));
		// rate constant of insulin degradation in the liver // [Dalla Man, IEEE TBME, 2007] (5)
		const m3 = params.m1 * HE / (1 - HE); // in 1/min
		
		
		
		// rate constant of gastric emptying - simplified placeholder
		// *** todo: replace with better model as described in [Dalla Man, IEEE TBME, 2006]
		const kempt = (params.kmax+params.kmin)/2; // in 1/min
		
		// declare vector of derivatives dx/dt
		let dx_dt = {};
		
		// Gp [Dalla Man, JDST, 2014] (A1), [Dalla Man, IEEE TBME, 2007] (1)
		dx_dt["Gp"] = EGP + Ra - Uii - E - params.k1*x["Gp"] + params.k2*x["Gt"];
		
		// Gt [Dalla Man, JDST, 2014] (A1), [Dalla Man, IEEE TBME, 2007] (1)
		dx_dt["Gt"] = -Uid + params.k1*x["Gp"] - params.k2*x["Gt"];
		
		// Ip [Dalla Man, JDST, 2014] (A2)
		dx_dt["Ip"] = -(params.m2 + params.m4)*x["Ip"] + params.m1*x["Il"] + Rai;
		
		// Il [Dalla Man, JDST, 2014] (A2)
		dx_dt["Il"] = params.m2*x["Ip"] - (params.m1+m3)*x["Il"];
		
		// Qsto1 [Dalla Man, JDST, 2014] (A3), [Dalla Man, IEEE TBME, 2007] (13)
		dx_dt["Qsto1"] = -params.kgri*x["Qsto1"] + M;
		
		// Qsto2 [Dalla Man, JDST, 2014] (A3), [Dalla Man, IEEE TBME, 2007] (13)
		dx_dt["Qsto2"] = -kempt*x["Qsto2"] + params.kgri*x["Qsto1"];
		
		// Qgut [Dalla Man, JDST, 2014] (A3), [Dalla Man, IEEE TBME, 2007] (13)
		dx_dt["Qgut"] = -params.kabs*x["Qgut"] + kempt*x["Qsto2"];
		
		// XL [Dalla Man, JDST, 2014] (A6), [Dalla Man, IEEE TBME, 2007] (11) (XL = Id)
		dx_dt["XL"] = -params.ki*(x["XL"] - x["I_"]);
		
		// I' [Dalla Man, JDST, 2014] (A7), [Dalla Man, IEEE TBME, 2007] (11) (I' = I1)
		dx_dt["I_"] = -params.ki*(x["I_"] - I);
		
		// X [Dalla Man, JDST, 2014] (A11), [Dalla Man, IEEE TBME, 2007] (18)
		dx_dt["X"] = -params.p2u*x["X"] + params.p2u*(I-this.xeq["Ip"]/params.VI);
		
		// Isc1 [Dalla Man, JDST, 2014] (A16)
		dx_dt["Isc1"] = -(params.kd + params.ka1)*x["Isc1"] + (IIR + bolus)/params.BW;
		
		// Isc2 [Dalla Man, JDST, 2014] (A16)
		dx_dt["Isc2"] = params.kd*x["Isc1"] - params.ka2*x["Isc2"];
		
		
		return dx_dt;
	};
	
	
	// compute outputs (returns object)
	getOutputs(_t, x, _u) {
		return {
			"Gp": x["Gp"] / this.parameters.VG,
		}
	};
	
}


// utility: solve n=2 linear system of equations
function solve2x2LSE(A,B) {
	const a = A[0][0];
	const b = A[0][1];
	const c = A[1][0];
	const d = A[1][1];
	
	const det = a*d-b*c;
	
	return [(+ d*B[0] - b*B[1])/det,
			(- c*B[0] + a*B[1])/det];
}


export default VirtualPatientUvaPadova;
