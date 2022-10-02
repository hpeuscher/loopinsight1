/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/


import ControllerMealBolus from './MealBolus.js'

import determine_basal from 'oref0/lib/determine-basal/determine-basal.js';
import tempBasalFunctions from 'oref0/lib/basal-set-temp.js';
import iob from 'oref0/lib/iob/index.js';
import getMealData from 'oref0/lib/meal/total.js';
import glucoseGetLast from 'oref0/lib/glucose-get-last.js'

// redirect console outputs of determine-basal and store them
var debugLog = "";
var log_fun = function () {
	let args = [];
	if (typeof arguments === "object") {
		args = Object.values(arguments);
	}
	else if (typeof arguments === "string") {
		args = [arguments];
	}
	else if (typeof arguments === "array") {
		args = arguments;
	}
	else {
		return;
	}

	for (let i = 0; i < args.length; i++) {
		if (typeof args[i] === "string") {
			debugLog = debugLog + args[i].trim() + " ";
		}
		else if (typeof args[i] === "object") {
			debugLog = debugLog + JSON.stringify(args[i]) + ";";
		}
		else {
			debugLog = debugLog + JSON.stringify(args[i]);
		}
	}
	debugLog = debugLog + ";";
};


class ControllerOref0 extends ControllerMealBolus {

	constructor({profile}) {
		super(arguments)				// meal bolus

		this.profile = profile;
		this.profile.type = "current";
		this.profile.min_5m_carbimpact = 12;
		this.profile.isfProfile = {
			sensitivities: [
				{ offset: 0, sensitivity: 100 }
			]
		}

		this.patient = {}
	}

	// reset and initialize
	reset() {
		this.currenttemp = {}
		this.treatmentHistory = []
		this.glucoseHistory = []

		// reset treatment
		this.ibolus = 0
		this.IIR = this.patient.IIReq
	}

	// obtain information about patient
	setPatient(patient) {
		this.patient = patient
	}
	

	/**
	 * computes insulin demand
	 * 
	 * @param {number} t - TODO
	 * @param {number} y - TODO
	 * @param {number} _x - TODO
	 * @returns {{iir: number, ibolus: number, logData: Object}} - TODO
	 */
	 computeTreatment(t, y, _x) {
		const mealBolus = super.computeTreatment(t, y, _x)

		let tNow = new Date(t);
		let G = y["G"];

		const ibolus = mealBolus["ibolus"]
		if (ibolus) {
			this.treatmentHistory.push({
				_type: "Bolus",
				timestamp: tNow.toISOString(),
				amount: ibolus,
				insulin: ibolus,
				date: tNow,
				dateString: tNow.toISOString(),
				started_at: tNow,
			})
		}


		// memorize meals
		let meal = this.announcedCarbs(t);
		if (meal > 0) {
			this.treatmentHistory.push({
				_type: "carbs",
				timestamp: tNow.toISOString(),
				carbs: meal,
				nsCarbs: meal,
			});
		}


		// run only every 5 minutes
		if (tNow.getMinutes() % 5) {
			return {iir: this.IIR, ibolus: this.bolus};
		}

		// add current glucose measurement to history
		this.glucoseHistory.unshift({
			date: tNow,
			dateString: tNow.toISOString(),
			glucose: G
		});


		// add effect of current temp (5min) to treatment history (->IOB)
		this.treatmentHistory.push({
			_type: "Temp Basal",
			eventType: "Temp Basal",
			rate: (this.IIR - this.patient.IIReq),
			date: tNow - 5 * 60 * 1000,
			timestamp: new Date(tNow - 5 * 60 * 1000),
			insulin: 5 / 60 * (this.IIR - this.patient.IIReq), // TODO : add duration
		});


		// compute glucose trends
		let glucose_status = glucoseGetLast(this.glucoseHistory)


		// redirect console outputs to capture them
		debugLog = "";
		if (typeof process.stderr === "undefined") {
			process.stderr = [];
		}
		process.stderr.write = log_fun;
		console.error = log_fun;


		// configure autosens
		let autosens = { ratio: 1.0 };	//***  todo -> separate task, every xx minutes, see autosense.js


		// compute IOB based on temp and bolus history
		let iob_data = iob(
			{
				profile: this.profile,
				clock: tNow,
			},
			false,
			this.treatmentHistory,
		);


		// compute meal data
		let opts = {
			treatments: this.treatmentHistory,
			profile: this.profile,
			pumphistory: this.treatmentHistory,		// -> total.js / iob_inputs
			glucose: this.glucoseHistory,
			basalprofile: {
				basals: [
					{ minutes: 0, rate: 1 }	// todo: for time-variant patient physiology, define profile of basal rate over the day
				]
			}
		};

		let meal_data = getMealData(opts, tNow);	// -> total.js

		// not sure why this is necessary; the entry seems to be overwritten??
		this.profile.current_basal = Number(this.patient.IIReq);

		// call determine-basal
		let basal = determine_basal(glucose_status,
			this.currenttemp,
			iob_data,
			this.profile,
			autosens,
			meal_data,
			tempBasalFunctions,
			false,
			undefined,
			tNow);

		// store bg prediction for interactive visualization
		let predBG = [];
		if (typeof basal.predBGs !== "undefined") {
			if (typeof basal.predBGs.COB !== "undefined") {
				// if prediction based on COB is available, use it
				predBG = basal.predBGs.COB;
			}
			else if (typeof basal.predBGs.IOB !== "undefined") {
				// otherwise, use prediction based on IOB
				predBG = basal.predBGs.IOB;
			}
		}

		basal.predictedBG = [];
		for (let i = 0; i < predBG.length; i++) {
			basal.predictedBG.push({ t: t + 5 * 60000 * i, BG: predBG[i] });
		}

		// prepare outputs
		if (typeof basal.rate !== 'undefined') {
			// remember new temp
			this.currenttemp = {
				duration: basal.duration,
				deliverAt: basal.deliverAt,
				rate: basal.rate,
				temp: "absolute"
			}

			this.IIR = basal.rate;
		} else {
			// todo: check if current temp is still active
			// otherwise, return to default
		}

		// store console outputs of determine-basal
		const logData = { ...basal }
		logData.debug = debugLog.split(";").map(s => s.trim()).filter(s => s.length != 0);
		try {
			logData.reason = logData.reason.split(/[,;]/).map(s => s.trim());
		} catch {
			logData.reason = ""
		}
		return {iir: this.IIR, ibolus, logData}
	}

}

export default ControllerOref0;
