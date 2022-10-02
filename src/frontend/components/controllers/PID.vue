<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import ImportController from "../../util/ImportController.js"

export const profile = {
	id: "PID",
	version: "0.2.0",
}

export default {

	props: {
		patient: Object,
	},

	emits: ["controllerChanged"],

	controller: {},

	data() {
		return {
			preBolusTime: 30,
			carbFactor: 1.5,
			useBolus: true,
			defaultBasalRate: 0,
			kP: 0.01,
			kI: 0.001,
			kD: 0.05,
			targetBG: 100,
		}
	},
	
	watch: {
		"patient.IIReq"() { 
			this.patientChanged()
		},
	},

	async mounted() {
		const loadController = ImportController("PID")
		const ControllerPID = await loadController()
		this.controller = new ControllerPID(this.$data)
		this.patientChanged()
	},

	methods: {
		patientChanged() {
			this.defaultBasalRate = Math.round(this.patient.IIReq*20)/20
			this.valueChanged()
		},

		valueChanged() {
			this.controller.defaultBasalRate = this.defaultBasalRate
			this.controller.kP = this.kP
			this.controller.kI = this.kI
			this.controller.kC = this.kD
			this.controller.targetBG = this.targetBG
			this.controller.active = this.useBolus
			this.controller.carbFactor = this.carbFactor
			this.controller.preBolusTime = this.preBolusTime

			this.$emit("controllerChanged", this.controller)
		},

		getController() {
			return this.controller
		},
	},
}
</script>


<template>
	<div id="controlleroptions" class="parameterlist">
		<ul>
			<li class="item">
				<label for="defaultBasalRate">
					<div class="item-description">{{$t("defaultBasalRate")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="defaultBasalRate" 
							id="defaultBasalRate" min="0" step="0.05" 
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
				<label for="targetBG">
					<div class="item-description">{{$t("targetBG")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="targetBG" 
							id="targetBG" min="0" step="0.05" 
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
				<label for="carbFactor">
					<div class="item-description">{{$t("carbFactor")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="carbFactor" 
							id="carbFactor" min="0" step="0.1" 
							@change="valueChanged">
					</div>
					<div class="item-unit">U/(10g CHO)</div>
				</label>
			</li>
			<li class="item" v-bind:class="{disabled: !useBolus}">
				<label for="preBolusTime">
					<div class="item-description">{{$t("preBolusTime")}}</div>
					<div class="item-input">
						<input type="number" v-model.number="preBolusTime" 
							id="preBolusTime" min="0" step="5" 
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
	"name": "PID controller + bolus",
	"defaultBasalRate": "default basal rate",
	"kP": "proportional factor",
	"kI": "integral factor",
	"kD": "differential factor",
	"targetBG": "target glucose concentration",
	"useBolus": "bolus with meal",
	"carbFactor": "carb factor",
	"preBolusTime": "time between bolus and meal",
}
</i18n>
<i18n locale="de">
{
	"name": "PID-Regler + Bolus",
	"defaultBasalRate": "Standardbasalrate",
	"kP": "Proportional-Faktor",
	"kI": "Integral-Faktor",
	"kD": "Differential-Faktor",
	"targetBG": "Ziel-Konzentration",
	"useBolus": "Bolus zur Mahlzeit",
	"carbFactor": "KE-Faktor",
	"preBolusTime": "Spritz-Ess-Abstand",
}
</i18n>
