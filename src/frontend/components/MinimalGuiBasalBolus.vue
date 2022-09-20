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
	data() {
		return {
			useBolus: true,
			PreBolusTime: 30,
			CarbFactor: 1.5,
			IIRb: 0,
			bolus: 0,
		}
	},
	watch: {
		"patient.IIReq": {
			handler: function(val) { 
				this.IIRb = Math.round(val*20)/20
				this.valueChanged()
			},
			immediate: true,
		}
	},
	mounted() {
	},
	methods: {
		valueChanged() {
			this.$emit("controllerChanged", this.getController())
		},
		
		getController() {
			let controller = new ControllerBasalBolus()
			controller.setParameters(
				this.IIRb,
				this.useBolus, 
				this.PreBolusTime, 
				this.CarbFactor
			)
			return controller
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
		<label for="CarbFactor">
			<div class="item-description">{{$t("CarbFactor")}}</div>
			<div class="item-input">
				<input type="number" v-model.number="CarbFactor" 
					id="CarbFactor" min="0" step="0.1" 
					@change="valueChanged">
			</div>
			<div class="item-unit">U/(10g CHO)</div>
		</label>
		<label for="PreBolusTime">
			<div class="item-description">{{$t("PreBolusTime")}}</div>
			<div class="item-input">
				<input type="number" v-model.number="PreBolusTime" 
					id="PreBolusTime" min="-30" step="5" 
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
	"CarbFactor": "carb factor",
	"PreBolusTime": "time between bolus and meal",
}
</i18n>
<i18n locale="de">
{
	"IIRb": "Basalrate",
	"useBolus": "Bolus zur Mahlzeit",
	"CarbFactor": "KE-Faktor",
	"PreBolusTime": "Spritz-Ess-Abstand",
}
</i18n>
