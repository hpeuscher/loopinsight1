<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import ControllerOref0 from '../ControllerOref0.js';
var oref0;

export default {
	props: {
		patient: Object,
	},
	emits: ["controllerChanged"],
	data() {
		return {
			profile: {
				max_iob: 3.5,
				dia: 6,
				max_daily_basal: 1.3,
				max_basal: 3.5,
				max_bg: 120,
				min_bg: 95,
				sens: 50,
				carb_ratio: 9,
				maxCOB: 120,
			},
			useBolus: true,
			PreBolusTime: 30,
			CarbFactor: 1.5, 
		}
	},
	mounted() {
		this.controllerChanged();
	},
	methods: {
		controllerChanged() {
			this.$emit("controllerChanged", this);
		},
		// setup (called before simulation)
		setup(patient) {
			oref0 = new ControllerOref0(
				this.profile,
				this.useBolus,
				this.PreBolusTime,
				this.CarbFactor
			);
			return oref0.setup(patient);
		},
		// compute insulin demand (function is called every minute)
		update(t, y, x, announcement) {
			return oref0.update(t, y, x, announcement);
		},
		// return current treatment
		//   iir: insulin infusion rate in U/h
		//   ibolus: insulin bolus in U
		getTreatment() {
			return oref0.getTreatment();
		},
	},
}
</script>


<template>
	<div id="controlleroptions" class="parameterlist">
		<ul>
			<li class="item">
				<label for="useBolus">
					<div class="item-description">{{$t("useBolus")}}</div>
					<div class="item-input">
						<input type="checkbox" v-model="useBolus"
							id="useBolus" 
							@change="controllerChanged">
					</div>
					<div class="item-unit"></div>
				</label>
			</li>
			<li class="item">
				<label for="CarbFactor">
					<div class="item-description">{{$t("CarbFactor")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="CarbFactor" 
							id="CarbFactor" min="0" step="0.1" 
							@change="controllerChanged">
					</div>
					<div class="item-unit">U/(10g CHO)</div>
				</label>
			</li>
			<li class="item" v-bind:class="{disabled: !useBolus}">
				<label for="PreBolusTime">
					<div class="item-description">{{$t("PreBolusTime")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="PreBolusTime" 
							id="PreBolusTime" min="0" step="5" 
							@change="controllerChanged">
					</div>
					<div class="item-unit">min</div>
				</label>
			</li>
			<li><hr></li>
			<li class="item">
				<label for="ISF">
					<div class="item-description">{{$t("ISF")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.sens" 
							id="ISF" min="20" step="5" 
							@change="controllerChanged">
					</div>
					<div class="item-unit">(mg/dl)/U</div>
				</label>
			</li>
			<li class="item">
				<label for="min_bg">
					<div class="item-description">{{$t("min_bg")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.min_bg" 
							id="min_bg" min="50" step="5" 
							@change="controllerChanged">
					</div>
					<div class="item-unit">mg/dl</div>
				</label>
			</li>
			<li class="item">
				<label for="max_bg">
					<div class="item-description">{{$t("max_bg")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.max_bg" 
							id="max_bg" min="100" step="5" 
							change="controllerChanged">
					</div>
					<div class="item-unit">mg/dl</div>
				</label>
			</li>
			<li class="item">
				<label for="DIA">
					<div class="item-description">{{$t("DIA")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.dia" 
							id="DIA" min="1" step="0.5" 
							@change="controllerChanged">
					</div>
					<div class="item-unit">h</div>
				</label>
			</li>
			<li class="item">
				<label for="CR">
					<div class="item-description">{{$t("CR")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.carb_ratio" 
							id="CR" min="1" step="0.5" 
							@change="controllerChanged">
					</div>
					<div class="item-unit">g/U</div>
				</label>
			</li>
			<li class="item">
				<label for="max_iob">
					<div class="item-description">{{$t("max_iob")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.max_iob" 
							id="max_iob" min="1" step="0.1" 
							@change="controllerChanged">
					</div>
					<div class="item-unit">U</div>
				</label>
			</li>
			<li class="item">
				<label for="max_basal">
					<div class="item-description">{{$t("max_basal")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="profile.max_basal" 
							id="max_basal" min="1" step="0.1" 
							@change="controllerChanged">
					</div>
					<div class="item-unit">U/h</div>
				</label>
			</li>
		</ul>
	</div>
</template>

<style scoped>
.disabled {
	pointer-events: none;
    opacity: 0.4;
}
</style>

<i18n locale="en">
{
	"useBolus": "Patient administers meal bolus",
	"CarbFactor": "carb factor",
	"PreBolusTime": "time between bolus and meal",
	"ISF": "Insulin sensitivity factor (ISF)",
	"min_bg": "minimum BG target",
	"max_bg": "maximum BG target",
	"DIA": "duration of insulin activity (DIA)",
	"CR": "carb ratio (CR)",
	"max_iob": "maximum IOB",
	"max_basal": "maximum basal",
}
</i18n>
<i18n locale="de">
{
	"useBolus": "Bolus zur Mahlzeit",
	"CarbFactor": "KE-Faktor",
	"PreBolusTime": "Spritz-Ess-Abstand",
	"ISF": "Insulin sensitivity factor (ISF)",
	"min_bg": "Untergrenze Zielwert Glukose",
	"max_bg": "Obergrenze Zielwert Glukose",
	"DIA": "Duration of Insulin Activity (DIA)",
	"CR": "carb ratio (CR)",
	"max_iob": "Maximalwert IOB",
	"max_basal": "Maximale Basalrate",
}
</i18n>
