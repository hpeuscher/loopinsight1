<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import ControllerBasalBolus from '../../core/controllers/BasalBolus.js';

export default {
	props: {
		patient: Object,
	},
	emits: ["controllerChanged"],
	controller: {},
	data() {
		return {
			useBolus: true,
			preBolusTime: 30,
			carbFactor: 1.5,
			basalRate: 0,
		}
	},
	mounted() {
		this.controller = new ControllerBasalBolus(this.$data)
		this.basalRate = Math.round(this.patient.IIReq*20)/20
		this.valueChanged()
	},
	watch: {
		"patient.IIReq"() { 
			this.valueChanged()
		},
	},
	methods: {
		valueChanged() {
			this.controller.carbFactor = this.carbFactor
			this.controller.preBolusTime = this.preBolusTime
			this.controller.active = this.useBolus
			this.controller.basalRate = this.basalRate
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
		<label for="carbFactor">
			<div class="item-description">{{$t("carbFactor")}}</div>
			<div class="item-input">
				<input type="number" v-model.number="carbFactor" 
					id="carbFactor" min="0" step="0.1" 
					@change="valueChanged">
			</div>
			<div class="item-unit">U/(10g CHO)</div>
		</label>
		<label for="preBolusTime">
			<div class="item-description">{{$t("preBolusTime")}}</div>
			<div class="item-input">
				<input type="number" v-model.number="preBolusTime" 
					id="preBolusTime" min="-30" step="5" 
					@change="valueChanged">
			</div>
			<div class="item-unit">min</div>
		</label>
	</div>
</template>


<style scoped>

</style>


<i18n locale="en">
{
	"IIRb": "basal rate",
	"useBolus": "bolus with meal",
	"carbFactor": "carb factor",
	"preBolusTime": "time between bolus and meal",
}
</i18n>
<i18n locale="de">
{
	"IIRb": "Basalrate",
	"useBolus": "Bolus zur Mahlzeit",
	"carbFactor": "KE-Faktor",
	"preBolusTime": "Spritz-Ess-Abstand",
}
</i18n>
