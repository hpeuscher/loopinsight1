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

export const profile = {
	id: "UvaPadova",
	version: "0.3.0",
	name: "UVA/Padova mockup",
}

const pmol_per_U = 6000;

// physiological model of virtual patient
class VirtualPatientUvaPadova {
	
	constructor(parameters) {
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

export default VirtualPatientUvaPadova


export const units = {
	/* states */
	"Gp"		: "mg/kg",
	"Gt"		: "mg/kg",
	"Ip"		: "pmol/kg",
	"Il"		: "pmol/kg",
	"Qsto1"		: "mg",
	"Qsto2"		: "mg",
	"Qgut"		: "mg",
	"XL"		: "pmol/L",
	"I_"		: "pmol/L",
	"X"			: "pmol/L",
	"Isc1"		: "pmol/kg",
	"Isc2"		: "pmol/kg",
	/* parameters */
	"BW"		: "kg",
	"Gpeq"		: "mg/kg",
	"VG" 		: "dL/kg",
	"k1" 		: "1/min",
	"k2" 		: "1/min",
	"VI" 		: "l/kg",
	"m1" 		: "1/min",
	"m2" 		: "1/min",
	"m4" 		: "1/min",
	"m5" 		: "min*kg/pmol",
	"m6" 		: "1",
	"HEeq" 		: "1",
	"kmax" 		: "1/min",
	"kmin" 		: "1/min",
	"kabs" 		: "1/min",
	"kgri" 		: "1/min",
	"f" 		: "1",
	"kp1" 		: "mg/kg/min",
	"kp2" 		: "1/min",
	"kp3"		: "mg/kg per pmol/L",
	"kp4"		: "mg/kg/min per pmol/kg",
	"ki"		: "1/min",
	"Fcns"		: "mg/kg/min",
	"Vm0"		: "mg/kg/min",
	"Vmx"		: "mg/kg/min per pmol/L",
	"Km0"		: "mg/kg",
	"p2u"		: "1/min",
	"ke1"		: "1/min",
	"ke2"		: "mg/kg",
	"ka1"		: "1/min",
	"ka2"		: "1/min",
	"kd" 		: "1/min",
	/* signals */
	"RaI"		: "pmol/kg/min",	
	"E"			: "mg/kg/min",
	"EGP"		: "mg/kg/min",
	"Uid"		: "mg/kg/min",
	"Uii"		: "mg/kg/min",
	"I"			: "pmol/L",
	"Qsto"		: "mg",
	"Ra"		: "mg/kg/min",
	"S"			: "pmol/kg/min",
	"HE"		: "1",
	"m3"		: "1/min",
}

export const html = {
	/* states */
	"Gp"		: "G<sub>p</sub>",
	"Gt"		: "G<sub>t</sub>",
	"Ip"		: "I<sub>p</sub>",
	"Il"		: "I<sub>l</sub>",
	"Qsto1"		: "Q<sub>sto1</sub>",
	"Qsto2"		: "Q<sub>sto2</sub>",
	"Qgut"		: "Q<sub>gut</sub>",
	"XL"		: "X<sub>L</sub>",
	"I_"		: "I'",
	"X"			: "X",
	"Isc1"		: "I<sub>sc1</sub>",
	"Isc2"		: "I<sub>sc2</sub>",
	/* parameters */
	"BW"		: "BW",
	"Gpeq"		: "G<sub>p,eq</sub>",
	"VG" 		: "V<sub>G</sub>",
	"k1" 		: "k<sub>1</sub>",
	"k2" 		: "k<sub>2</sub>",
	"VI" 		: "V<sub>I</sub>",
	"m1" 		: "m<sub>1</sub>",
	"m2" 		: "m<sub>2</sub>",
	"m4" 		: "m<sub>4</sub>",
	"m5" 		: "m<sub>4</sub>",
	"m6" 		: "m<sub>6</sub>",
	"HEeq" 		: "HE<sub>eq</sub>",
	"kmax" 		: "k<sub>max</sub>",
	"kmin" 		: "k<sub>min</sub>",
	"kabs" 		: "k<sub>abs</sub>",
	"kgri" 		: "k<sub>gri</sub>",
	"f" 		: "f",
	"kp1" 		: "k<sub>p1</sub>",
	"kp2" 		: "k<sub>p2</sub>",
	"kp3"		: "k<sub>p3</sub>",
	"kp4"		: "k<sub>p4</sub>",
	"ki"		: "k<sub>i</sub>",
	"Fcns"		: "F<sub>cns</sub>",
	"Vm0"		: "V<sub>m0</sub>",
	"Vmx"		: "V<sub>mx</sub>",
	"Km0"		: "K<sub>m0</sub>",
	"p2u"		: "p<sub>2u</sub>",
	"ke1"		: "k<sub>e1</sub>",
	"ke2"		: "k<sub>e2</sub>",
	"ka1"		: "k<sub>a1</sub>",
	"ka2"		: "k<sub>a2</sub>",
	"kd" 		: "k<sub>d</sub>",
	/* signals */
	"RaI"		: "R<sub>aI</sub>",
	"E"			: "E",
	"EGP"		: "EGP",
	"Uid"		: "U<sub>id</sub>",
	"Uii"		: "U<sub>ii</sub>",
	"I"			: "I",
	"Qsto"		: "Q<sub>sto</sub>",
	"Ra"		: "R<sub>a</sub>",
	"S"			: "S",
	"HE"		: "HE",
	"m3"		: "m<sub>3</sub>",
}

export const i18n = {
en: {
	"name"		: "UVA/Padova mockup",
	/* states */
	"Gp"		: "glucose in plasma",
	"Gt"		: "glucose in tissue",
	"Ip"		: "insulin in plasma",
	"Il"		: "insulin in liver",
	"Qsto1"		: "carbs in stomach, solid phase",
	"Qsto2"		: "carbs in stomach, liquid phase",
	"Qgut"		: "glucose mass in intestine",
	"XL"		: "insulin delay compartment 2",
	"I_"		: "insulin delay compartment 1",
	"X"			: "insulin in the interstitial fluid",
	"Isc1"		: "subcutaneous insulin in compartment 1",
	"Isc2"		: "subcutaneous insulin in compartment 2",
	/* parameters */
	"BW"		: "body weight",
	"Gpeq"		: "steady-state of glucose in plasma",
	"VG" 		: "distribution volume of glucose",
	"k1" 		: "rate parameter from Gp to Gt",
	"k2" 		: "rate parameter from Gt to Gp",
	"VI" 		: "distribution volume of insulin",
	"m1" 		: "rate parameter from Il to Ip",
	"m2" 		: "rate parameter from Ip to Il",
	"m4" 		: "rate parameter from Ip to periphery",
	"m5" 		: "rate parameter of hepatic extraction (slope)",
	"m6" 		: "rate parameter of hepatic extraction (offset)",
	"HEeq" 		: "steady-state hepatic extraction of insulin",
	"kmax" 		: "maximal emptying rate of stomach",
	"kmin" 		: "minimal emptying rate of stomach",
	"kabs" 		: "rate constant of intestinal absorption",
	"kgri" 		: "rate of grinding",
	"f" 		: "fraction of intestinal absorption",
	"kp1" 		: "extrapolated at zero glucose and insulin",
	"kp2" 		: "liver glucose effectiveness",
	"kp3"		: "amplitude of insulin action on the liver",
	"kp4"		: "amplitude of portal insulin action on the liver",
	"ki"		: "delay between insulin signal and insulin action",
	"Fcns"		: "glucose uptake by the brain and erythrocytes",
	"Vm0"		: "Michaelis-Menten constant (offset)",
	"Vmx"		: "Michaelis-Menten constant (slope)",
	"Km0"		: "Michaelis-Menten constant (offset)",
	"p2u"		: "insulin action on the peripheral glucose utilization",
	"ke1"		: "glomerular filtration rate",
	"ke2"		: "renal threshold of glucose",
	"ka1"		: "rate constant of nonmonomeric insulin absorption",
	"ka2"		: "rate constant of monomeric insulin absorption",
	"kd" 		: "rate constant of insulin dissociation",
	/* signals */
	"RaI"		: "insulin appearance rate",
	"E"			: "renal glucose excretion",
	"EGP"		: "endogenous glucose production",
	"Uid"		: "insulin-dependent glucose utilization",
	"Uii"		: "insulin-independent glucose utilization",
	"I"			: "plasma insulin concentration",
	"Qsto"		: "amount of glucose in the stomach",
	"Ra"		: "appearance rate of glucose in plasma",
	"S"			: "insulin secretion",
	"HE"		: "hepatic extraction",
	"m3"		: "rate constant of insulin degradation in the liver",
},

de: {
	"name"		: "UVA/Padova-Modell",
	/* states */
	"Gp"		: "Glukose im Plasma",
	"Gt"		: "Glukose im Gewebe",
	"Ip"		: "Insulin im Plasma",
	"Il"		: "Insulin in der Leber",
	"Qsto1"		: "Kohlenhydrate im Magen, Festphase",
	"Qsto2"		: "Kohlenhydrate im Magen, Flüssigphase",
	"Qgut"		: "Glukose im Darm",
	"XL"		: "Insulin Verzögerungskompartiment 1",
	"I_"		: "Insulin Verzögerungskompartiment 2",
	"X"			: "Insulin in der Interstitialflüssigkeit",
	"Isc1"		: "Subkutanes Insulin im Kompartiment 1",
	"Isc2"		: "Subkutanes Insulin im Kompartiment 2",
	/* parameters */
	"BW"		: "Körpergewicht",
	"Gpeq"		: "Glukose im Plasma im Gleichgewicht",
	"VG" 		: "Verteilungsvolumen der Glukose",
	"k1" 		: "Übergangsgeschwindigkeit von Gp nach Gt",
	"k2" 		: "Übergangsgeschwindigkeit von Gt nach Gp",
	"VI" 		: "Verteilungsvolumen des Insulins",
	"m1" 		: "Übergangsgeschwindigkeit von Il nach Ip",
	"m2" 		: "Übergangsgeschwindigkeit von Ip nach Il",
	"m4" 		: "Übergangsgeschwindigkeit von Ip in die Peripherie",
	"m5" 		: "Geschwindigkeit der hepatischen Extraction (Steigung)",
	"m6" 		: "Geschwindigkeit der hepatischen Extraction (Offset)",
	"HEeq" 		: "Hepatische Insulin-Extraktion im Gleichgewicht",
	"kmax" 		: "Maximale Entleerungsrate des Magens",
	"kmin" 		: "Minimale Entleerungsrate des Magens",
	"kabs" 		: "Geschwindigkeit der Absorption im Darm",
	"kgri" 		: "Geschwindigkeit der Zerkleinerung im Magen",
	"f" 		: "Anteil der Absorption im Darm",
	"kp1" 		: "extrapolated at zero glucose and insulin",
	"kp2" 		: "liver glucose effectiveness",
	"kp3"		: "amplitude of insulin action on the liver",
	"kp4"		: "amplitude of portal insulin action on the liver",
	"ki"		: "delay between insulin signal and insulin action",
	"Fcns"		: "glucose uptake by the brain and erythrocytes",
	"Vm0"		: "Michaelis-Menten constant (offset)",
	"Vmx"		: "Michaelis-Menten constant (slope)",
	"Km0"		: "Michaelis-Menten constant (offset)",
	"p2u"		: "insulin action on the peripheral glucose utilization",
	"ke1"		: "glomerular filtration rate",
	"ke2"		: "renal threshold of glucose",
	"ka1"		: "rate constant of nonmonomeric insulin absorption",
	"ka2"		: "rate constant of monomeric insulin absorption",
	"kd" 		: "rate constant of insulin dissociation",
	/* signals */
	"RaI"		: "insulin appearance rate",
	"E"			: "renal glucose excretion",
	"EGP"		: "endogenous glucose production",
	"Uid"		: "insulin-dependent glucose utilization",
	"Uii"		: "insulin-independent glucose utilization",
	"I"			: "plasma insulin concentration",
	"Qsto"		: "amount of glucose in the stomach",
	"Ra"		: "appearance rate of glucose in plasma",
	"S"			: "insulin secretion",
	"HE"		: "hepatic extraction",
	"m3"		: "rate constant of insulin degradation in the liver",
},
}

export const diagram = {

	subsystems: [
		{x: 210,	y: 110,	width: 180,	height: 300,	fill: "#DDDDFF",	label: { text: "insulin subsystem" } },
		{x: 410,	y:  10,	width: 280,	height: 300,	fill: "#FFDDDD",	label: { text: "glucose subsystem" } },
		{x: -40,	y: 250,	width: 230,	height: 200,	fill: "#DDFFCC",	label: { text: "subcutaneous transport" } },
		{x: 60,		y: 10,	width: 330,	height: 90,		fill: "#FFDD55",	label: { text: "meal subsystem" } },
	],

	nodes: {
		"Gp":       { x: 550,   y: 150,     geometry: {shape: "circle", d: 50} },
		"Gt":       { x: 550,   y: 250,     geometry: {shape: "circle", d: 50} },
		"Ip":       { x: 250,   y: 350,     geometry: {shape: "circle", d: 50} },
		"Il":       { x: 350,   y: 350,     geometry: {shape: "circle", d: 50} },
		"Qsto1":    { x: 150,   y: 50,      geometry: {shape: "circle", d: 50} },
		"Qsto2":    { x: 250,   y: 50,      geometry: {shape: "circle", d: 50} },
		"Qgut":     { x: 350,   y: 50,      geometry: {shape: "circle", d: 50} },
		"I_":       { x: 250,   y: 150,     geometry: {shape: "circle", d: 50} },
		"XL":       { x: 350,   y: 150,     geometry: {shape: "circle", d: 50} },
		"X":        { x: 350,   y: 250,     geometry: {shape: "circle", d: 50} },
		"Isc1":     { x:  50,   y: 300,     geometry: {shape: "circle", d: 50} },
		"Isc2":     { x:  50,   y: 400,     geometry: {shape: "circle", d: 50} },

		"G":        { x: 650,   y: 150,     geometry: {shape: "square", d: 40} },
		"Ra":       { x: 450,   y: 50,      geometry: {shape: "square", d: 40} },
		"EGP":      { x: 450,   y: 150,     geometry: {shape: "square", d: 40} },
		"E":        { x: 550,   y: 50,      geometry: {shape: "square", d: 40} },
		"Uid":      { x: 450,   y: 250,     geometry: {shape: "square", d: 40} },
		"Uii":      { x: 650,   y: 50,      geometry: {shape: "square", d: 40} },
		"I":        { x: 250,   y: 250,     geometry: {shape: "square", d: 40} },
		"RaI":      { x: 150,   y: 350,     geometry: {shape: "square", d: 40} },
	},

	connections: [
		{	from: {id: "Gp",	angle:	-60		}, 	to: {id: "Gt",		angle: 60	},	type: "arrow",	label: {text: "k1"} },
		{	from: {id: "Gt",	angle:	120		}, 	to: {id: "Gp",		angle: -120	},	type: "arrow",	label: {text: "k2"} },
		{	from: {id: "Qsto1"					},	to: {id: "Qsto2",				},	type: "arrow",	label: {text: "kgri"} },
		{	from: {id: "Qsto2"					},	to: {id: "Qgut",				},	type: "arrow",	label: {text: "kempt"} },
		{	from: {id: "Qgut"					},	to: {id: "Ra",					},	type: "arrow",	label: {text: "kabs"} },
		{	from: {id: "Ra",    angle:  0		}, 	to: {id: "Gp",		angle: 120 	},	type: "arrow",	},
		{	from: {id: "E",     angle:  270		}, 	to: {id: "Gp",		angle: 90  	},	type: "arrow",	},
		{	from: {id: "Uii",   angle:  180		}, 	to: {id: "Gp",		angle: 60  	},	type: "arrow",	},
		{	from: {id: "I_"						}, 	to: {id: "XL"					},	type: "arrow",	label: {text: "ki"} },
		{	from: {id: "I"						}, 	to: {id: "X"					},	type: "arrow",	label: {text: "p2u"} },
		{	from: {id: "I"						}, 	to: {id: "I_"					},	type: "arrow",	label: {text: ""} },
		{	from: {id: "XL"						}, 	to: {id: "EGP"					},	type: "arrow",	},
		{	from: {id: "EGP"					},	to: {id: "Gp"					},	type: "arrow",	},
		{	from: {x: 450, 		y: 100			},	to: {id: "EGP"					},	type: "arrow",	label: {text: "kp1"} },
		{	from: {id: "Gp",	angle:	150		},	to: {id: "EGP",		angle: 30	},	type: "arrow",	label: {text: "kp2"} },
		{	from: {id: "X"						},	to: {id: "Uid"					},	type: "arrow",	label: {text: "Vmx"} },
		{	from: {x: 450,		y: 300			},	to: {id: "Uid"					},	type: "arrow",	label: {text: "Vm0"} },
		{	from: {id: "Uid"					}, 	to: {id: "Gt"					},	type: "arrow",	},
		{	from: {id: "Ip",	angle:	30		}, 	to: {id: "Il",		angle: 150	},	type: "arrow",	},
		{	from: {id: "Il",	angle:	-150	}, 	to: {id: "Ip",		angle: -30	},	type: "arrow",	},
		{	from: {id: "RaI"					},	to: {id: "Ip",					},	type: "arrow",	},
		{	from: {id: "Isc1",	angle:	-90		}, 	to: {id: "Isc2",	angle: 90	},	type: "arrow",	label: {text: "kd"} },
		{	from: {id: "Isc1",	angle:	0		}, 	to: {id: "RaI",		angle: 120	},	type: "arrow",	label: {text: "ka1"} },
		{	from: {id: "Isc2",	angle:	0		}, 	to: {id: "RaI",		angle: -120	},	type: "arrow",	label: {text: "ka2"} },
		{	from: {id: "Ip",	angle: 90		},	to: {id: "I",		angle: -90	} },
		{	from: {id: "Gp",	angle: 0		},	to: {id: "G",		angle: 180	} },
	],

	
	inputs: {
		"carbs":	{ to: {id: "Qsto1", angle: 0 } },
		"iir":		{ to: {id: "Isc1", angle: 0 } },
	},

}