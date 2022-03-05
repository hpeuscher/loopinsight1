<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import ControllerPID from '../../core/ControllerPID.js';

export default {
	props: {
		patient: Object,
	},
	emits: ["controllerChanged"],
	data() {
		return {
			controller: {},
			useBolus: true,
			PreBolusTime: 30,
			CarbFactor: 1.5,
			IIRb: 0,
			kP: 0.01,
			kI: 0.001,
			kD: 0.05,
			target: 100,
			bolus: 0,
		}
	},
	watch: {
		"patient.IIReq": {
			handler: function(val) { this.IIRb = Math.round(val*20)/20; },
			immediate: true,
		}
	},
	mounted() {
		this.controller = new ControllerPID();
		this.valueChanged();
		this.$emit("controllerChanged", this)
	},
	methods: {
		valueChanged() {
			this.controller.setParams(
				this.IIRb,
				this.kP,
				this.kI,
				this.kD,
				this.target,
				this.useBolus, 
				this.PreBolusTime, 
				this.CarbFactor,
			)
		},
		// setup (called before simulation)
		setup(patient) {
			this.controller.setup(patient)
			this.valueChanged()
		},
		// compute insulin demand (function is called every minute)
		update(t, y, x, announcement) {
			// compute bolus (IIR remains constant all the time)
			return this.controller.update(t, y, x, announcement);
		},
		// return current treatment
		getTreatment() {
			return this.controller.getTreatment();
		},
	},
}
</script>


<template>
	<div id="controlleroptions" class="parameterlist">
		<ul>
			<li class="item">
				<label for="IIRb">
					<div class="item-description">{{$t("IIRb")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="IIRb" 
							id="IIRb" min="0" step="0.05" 
							@change="valueChanged">
					</div>
					<div class="item-unit">U/h</div>
				</label>
			</li>
			<li class="item">
				<label for="kP">
					<div class="item-description">{{$t("kP")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="kP" 
							id="kP" min="0" step="0.002" 
							@change="valueChanged">
					</div>
					<div class="item-unit">U/h / (mg/dl)</div>
				</label>
			</li>
			<li class="item">
				<label for="kI">
					<div class="item-description">{{$t("kI")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="kI" 
							id="kI" min="0" step="0.001" 
							@change="valueChanged">
					</div>
					<div class="item-unit">U/h / (mg/dl) / h</div>
				</label>
			</li>
			<li class="item">
				<label for="kD">
					<div class="item-description">{{$t("kD")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="kD" 
							id="kD" min="0" step="0.01" 
							@change="valueChanged">
					</div>
					<div class="item-unit">U/h / (mg/dl) * h</div>
				</label>
			</li>
			<li class="item">
				<label for="target">
					<div class="item-description">{{$t("target")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="target" 
							id="target" min="0" step="0.05" 
							@change="valueChanged">
					</div>
					<div class="item-unit">mg/dl</div>
				</label>
			</li>
			<li class="item">
				<label for="useBolus">
					<div class="item-description">{{$t("useBolus")}}</div>
					<div class="item-input">
						<input type="checkbox" v-model="useBolus"
							id="useBolus" 
							@change="valueChanged">
					</div>
					<div class="item-unit"></div>
				</label>
			</li>
			<li class="item" v-bind:class="{disabled: !useBolus}">
				<label for="CarbFactor">
					<div class="item-description">{{$t("CarbFactor")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="CarbFactor" 
							id="CarbFactor" min="0" step="0.1" 
							@change="valueChanged">
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
							@change="valueChanged">
					</div>
					<div class="item-unit">min</div>
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
	"IIRb": "basal rate",
	"kP": "proportional factor",
	"kI": "integral factor",
	"kD": "differential factor",
	"target": "target glucose concentration",
	"useBolus": "bolus with meal",
	"CarbFactor": "carb factor",
	"PreBolusTime": "time between bolus and meal",
}
</i18n>
<i18n locale="de">
{
	"IIRb": "Basalrate",
	"kP": "Proportional-Faktor",
	"kI": "Integral-Faktor",
	"kD": "Differential-Faktor",
	"target": "Ziel-Konzentration",
	"useBolus": "Bolus zur Mahlzeit",
	"CarbFactor": "KE-Faktor",
	"PreBolusTime": "Spritz-Ess-Abstand",
}
</i18n>
