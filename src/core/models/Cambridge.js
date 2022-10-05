/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


export const profile = {
	id: "Cambridge",
	version: "0.3.0",
	name: "Cambridge",
}


const pmol_per_U = 6000;
const mmolG2mg = 180.16;


// physiological model of virtual patient
class VirtualPatientCambridge {
	
	constructor(parameters) {
		// list of inputs used by this model
		this.inputList = ["meal", "IIR", "bolus"]
		
		// list of outputs provided by this model
		this.outputList = ["G"]
		
		// list of derived quantities
		this.signalList = [];
		
		// default parameters
		this.defaultParameters = {
			"Gpeq"	: 100,		// mg/dL
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
		
		// set parameters and compute equilibrium
		this.parameters = {...this.defaultParameters, ...parameters}
		this.computeSteadyState();

		// extract full list of parameters
		this.parameterList = Object.keys(this.defaultParameters)

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
		
		const Gpeq = params.Gpeq / mmolG2mg * 10	// in mmol/L
		const Q1eq = Gpeq * params.VG * params.BW
		const F01eq = params.F01 * params.BW * Math.min(Gpeq / 4.5, 1)
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
		const M = (u["carbs"] || 0 ) / mmolG2mg * 1000 	// meal ingestion in mmol/min
		const IIR = (u["iir"] || 0 ) * 1000 / 60 		// insulin infusion rate in mU/min
		const bolus = (u["ibolus"] || 0) * 1000			// insulin bolus in mU
		
		
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



export const units = {
	/* states */
	"Q1"		: "mmol",
	"Q2"		: "mmol",
	"S1"		: "mU",
	"S2"		: "mU",
	"I"			: "mU/L",
	"x1"		: "1/min",
	"x2"		: "1/min",
	"x3"		: "1",
	"D1"		: "mmol",
	"D2"		: "mmol",
	/* parameters */
	"Gpeq"		: "mg/dL",
	"BW"		: "kg",
	"k12"		: "1/min",
	"ka1" 		: "1/min",
	"ka2" 		: "1/min",
	"ka3" 		: "1/min",
	"ke" 		: "1/min",
	"VI" 		: "L/kg",
	"VG"		: "L/kg",
	"AG"		: "1",
	"tmaxG"		: "min",
	"SIT" 		: "1/min/mU/L",
	"SID" 		: "1/min/mU/L",
	"SIE" 		: "1/mU/L",
	"EGP0"		: "mmol/kg/min",
	"F01"		: "mmol/kg/min",
	"tmaxI"		: "min",
}

export const html = {
	/* states */
	"Q1"		: "Q<sub>1</sub>",
	"Q2"		: "Q<sub>2</sub>",
	"S1"		: "S<sub>1</sub>",
	"S2"		: "S<sub>2</sub>",
	"I"			: "I",
	"x1"		: "x<sub>1</sub>",
	"x2"		: "x<sub>2</sub>",
	"x3"		: "x<sub>3</sub>",
	"D1"		: "D<sub>1</sub>",
	"D2"		: "D<sub>2</sub>",
	/* parameters */
	"Gpeq"		: "G<sub>p,eq</sub>",
	"BW"		: "BW",
	"k12"		: "k<sub>12</sub>",
	"ka1" 		: "k<sub>a1</sub>",
	"ka2" 		: "k<sub>a2</sub>",
	"ka3" 		: "k<sub>a3</sub>",
	"ke" 		: "k<sub>e</sub>",
	"VI" 		: "V<sub>I</sub>",
	"VG"		: "V<sub>G</sub>",
	"AG"		: "A<sub>G</sub>",
	"tmaxG"		: "t<sub>max,G</sub>",
	"SIT" 		: "S<sub>IT</sub>",
	"SID" 		: "S<sub>ID</sub>",
	"SIE" 		: "S<sub>IE</sub>",
	"EGP0"		: "EGP<sub>0</sub>",
	"F01"		: "F<sub>01</sub>",
	"tmaxI"		: "t<sub>max,I</sub>",
}

export const i18n = {
en: {
	"name"		: "Cambridge",
	/* states */
	"Q1"		: "mass in accessible compartment (plasma)",
	"Q2"		: "mass in non-accessible compartment",
	"S1"		: "amount of insulin in compartment 1",
	"S2"		: "amount of insulin in compartment 2",
	"I"			: "plasma insulin",
	"x1"		: "insulin action on glucose transport",
	"x2"		: "insulin action on glucose disposal",
	"x3"		: "insulin action on endogenous glucose production",
	"D1"		: "glucose in compartment 1",
	"D2"		: "glucose in compartment 2",
	/* parameters */
	"Gpeq"		: "steady-state of glucose in plasma",
	"BW"		: "body weight",
	"k12" 		: "transfer rate from the non-accessible to the accessible compartment",
	"ka1" 		: "deactivation rate",
	"ka2" 		: "deactivation rate",
	"ka3" 		: "deactivation rate",
	"ke"		: "insulin elimination from plasma",
	"VI" 		: "insulin distribution volume",
	"VG" 		: "distribution volume of the accessible compartment",
	"AG"		: "carbohydrate (CHO) bioavailability",
	"tmaxG"		: "time-to-maximum of CHO absorption",
	"SIT" 		: "insulin sensitivity of distribution/transport",
	"SID" 		: "insulin sensitivity of disposal",
	"SIE" 		: "insulin sensitivity of EGP",
	"EGP0"		: "endogenous glucose production (EGP) extrapolated to the zero insulin concentration",
	"F01"		: "non-insulin-dependent glucose ﬂux",
	"tmaxI"		: "time-to-maximum of absorption of subcutaneously injected short-acting insulin",
	/* signals */
	"EGP"		: "endogenous glucose production",
},

de: {
	"name"		: "Cambridge / Cambridge",
	/* states */
	"Q1"		: "mass in accessible compartment (plasma)",
	"Q2"		: "mass in non-accessible compartment",
	"S1"		: "amount of insulin in compartment 1",
	"S2"		: "amount of insulin in compartment 2",
	"I"			: "plasma insulin",
	"x1"		: "insulin action on glucose transport",
	"x2"		: "insulin action on glucose disposal",
	"x3"		: "insulin action on endogenous glucose production",
	"D1"		: "glucose in compartment 1",
	"D2"		: "glucose in compartment 2",
	/* parameters */
	"Gpeq"		: "Glukose im Plasma im Gleichgewicht",
	"BW"		: "Körpergewicht",
	"k12" 		: "transfer rate from the non-accessible to the accessible compartment",
	"ka1" 		: "deactivation rate",
	"ka2" 		: "deactivation rate",
	"ka3" 		: "deactivation rate",
	"ke"		: "insulin elimination from plasma",
	"VI" 		: "insulin distribution volume",
	"VG" 		: "distribution volume of the accessible compartment",
	"AG"		: "Bioverfügbarkeit der Kohlenhydrate",
	"tmaxG"		: "time-to-maximum of CHO absorption",
	"SIT" 		: "Insulinsensitivität of distribution/transport",
	"SIT" 		: "Insulinsensitivität of distribution/transport",
	"SIT" 		: "Insulinsensitivität of distribution/transport",
	"SID" 		: "Insulinsensitivität of disposal",
	"SIE" 		: "Insulin sensitivity of EGP",
	"EGP0"		: "endogenous glucose production (EGP) extrapolated to the zero insulin concentration",
	"F01"		: "non-insulin-dependent glucose ﬂux",
	"tmaxI"		: "time-to-maximum of absorption of subcutaneously injected short-acting insulin",
	/* signals */
	"EGP"		: "endogene Glukoseproduktion",
},
}

export const diagram = {

	subsystems: [
		{x: 60,		y: 110,		width: 330, height: 100, fill: "#DDDDFF", label: { text: "endogenous glucose production" } },
		{x: 400,	y:  10,		width: 320, height: 390, fill: "#FFDDDD", label: { text: "glucose subsystem" } },
		{x: 60,		y: 300,		width: 330, height: 100, fill: "#DDFFCC", label: { text: "insulin pharmacokinetics" } },
		{x: 60,		y: 10,		width: 330, height: 90,  fill: "#FFDD55", label: { text: "meal subsystem" } },
	],

	nodes: {
		"Q1":	{ x: 500,	y: 150,		geometry: {shape: "circle", d: 50} },
		"Q2":	{ x: 600,	y: 150,		geometry: {shape: "circle", d: 50} },
		"S1":	{ x: 150,	y: 350,		geometry: {shape: "circle", d: 50} },
		"S2":	{ x: 250,	y: 350,		geometry: {shape: "circle", d: 50} },
		"I"	:	{ x: 350,	y: 350,		geometry: {shape: "circle", d: 50} },
		"x3":	{ x: 450,	y: 250,		geometry: {shape: "circle", d: 50} },
		"x1":	{ x: 550,	y: 250,		geometry: {shape: "circle", d: 50} },
		"x2":	{ x: 650,	y: 250,		geometry: {shape: "circle", d: 50} },
		"D1":	{ x: 150,	y:  50,		geometry: {shape: "circle", d: 50} },
		"D2":	{ x: 250,	y:  50,		geometry: {shape: "circle", d: 50} },

		"Ra":	{ x: 350,	y:  50,		geometry: {shape: "square", d: 40} },
		"EGP":	{ x: 350,	y:  150,	geometry: {shape: "square", d: 40} },

		"G":	{ x: 500,	y:  50,		geometry: {shape: "square", d: 40, doubleLine: 1},	class: "output" },
	},

	connections: [
		{ type: "arrow",	from: {id: "Q1",	angle:  -30	}, 	to: {id: "Q2",	angle: -150 	}, id: "Q1Q2"},
		{ type: "arrow",	from: {id: "Q2",	angle:  150	}, 	to: {id: "Q1",	angle: 30 		}, label: {text: "k12"} },
		{ type: "arrow",	from: {id: "Q2"					}, 	to: {x: 675, 	y: 150 			}, id: "Q2away", label: {text: ""} },
		{ type: "arrow",	from: {id: "x1"					}, 	to: {id: "Q1Q2"					}, label: {text: ""}, style: "stroke-dasharray: 5 5" },
		{ type: "arrow",	from: {id: "x2"					}, 	to: {id: "Q2away", angle: -90	}, label: {text: ""}, style: "stroke-dasharray: 5 5" },
		{ type: "arrow",	from: {id: "S1"					}, 	to: {id: "S2"					}, label: {text: "tmaxI"} },
		{ type: "arrow",	from: {id: "S2"					}, 	to: {id: "I"					}, label: {text: "tmaxI"} },
		{ type: "arrow",	from: {id: "I"					}, 	to: {x:	385, y: 385				}, label: {text: "ke"} },
		{ type: "arrow",	from: {id: "I",		angle:  20	}, 	to: {id: "x3",	angle:  -110	}, label: {text: "SIE"} },
		{ type: "arrow",	from: {id: "I",		angle:  10	}, 	to: {id: "x1",	angle:  -120	}, label: {text: "SIT"} },
		{ type: "arrow",	from: {id: "I",		angle:  0	}, 	to: {id: "x2",	angle:  -135	}, label: {text: "SID"} },
		{ type: "arrow",	from: {id: "x3"					}, 	to: {x:485, 	y:285			}, label: {text: "ka3"} },
		{ type: "arrow",	from: {id: "x1"					}, 	to: {x:585, 	y:285			}, label: {text: "ka1"} },
		{ type: "arrow",	from: {id: "x2"					}, 	to: {x:685, 	y:285			}, label: {text: "ka2"} },
		{ type: "arrow",	from: {id: "D1"					}, 	to: {id: "D2"					}, label: {text: "tmaxG"} },
		{ type: "arrow",	from: {id: "D2"					}, 	to: {id: "Ra"					}, label: {text: "tmaxG"} },
		{ type: "arrow",	from: {id: "D2"					}, 	to: {x: 285, y: 85				}, label: {text: "tmaxG"} },
		{ type: "arrow",	from: {id: "Ra",	angle:  0	}, 	to: {id: "Q1",	angle:  120		}, },
		{ type: "arrow",	from: {id: "x3",	angle:  105	}, 	to: {id: "EGP",	angle:  -15		}, style: "stroke-dasharray: 5 5" },
		{ type: "arrow",	from: {id: "EGP"				}, 	to: {id: "Q1"					}, },
		{ type: "arrow",	from: {x: 250, y:150			}, 	to: {id: "EGP"					}, label: {text: "EGP0"} },
		{ from: {id: "Q1"}, 	to: {id: "G"} },
	],

	inputs: {
		"CHO":	{ to: {id: "D1", angle: 0 } },
		"IIR":	{ to: {id: "S1", angle: 0 } },
	},

}
