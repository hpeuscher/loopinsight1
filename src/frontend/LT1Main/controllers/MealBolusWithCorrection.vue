<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import {defineComponent, toRaw } from 'vue'
import ControllerConfig from '../ControllerConfig.vue'
import Controller from '../../../types/Controller.js'
import ControllerMealBolus from '../../../core/controllers/MealBolus.js'
import ControllerUnion from '../../../core/ControllerUnion.js'

export const profile = {
	id: "MealBolusWithCorrection",
	version: "0.3.0",
}


export default defineComponent({
    components: {
        ControllerConfig
    },

    emits: ["controllerChanged"],

	data() {
		return {
			useMealBolus: true,
            useCorrectionBolus: true,
		}
	},

	methods: {
        getController(): Controller {
            if (!this.useMealBolus) {
                return toRaw(new ControllerMealBolus({carbFactor: 0}))
            }         
            else {
                if (!this.useCorrectionBolus) {
                    const mealBolus = <InstanceType<typeof ControllerConfig>>
                        this.$refs.mealBolus
                    return toRaw(mealBolus.getController())
                }
                else {
                    // TODO: first check if ALL parts of ControllerUnion are valid            
                    const mealBolus = <InstanceType<typeof ControllerConfig>>
                        this.$refs.mealBolus
                    const correctionBolus = <InstanceType<typeof ControllerConfig>>
                        this.$refs.correctionBolus
                    return toRaw(new ControllerUnion([
                        toRaw(mealBolus.getController()),
                        toRaw(correctionBolus.getController())
                    ]))
                }
            }
        },

        valueChanged() {
            this.$emit('controllerChanged', this.getController())
        },

	},
})
</script>


<template>
    <div>
        <div class="boolean-parameter">
            <input type="checkbox" v-model="useMealBolus"
                @change="valueChanged">{{ $t('useMealBolus') }}
        </div>
        <ControllerConfig ref="mealBolus" 
            :id="'MealBolus'" :version="'2.0.0'" 
            :class="{disabled: !useMealBolus}"
            @controllerChanged="valueChanged"/>
        <div class="boolean-parameter" :class="{disabled: !useMealBolus}">
            <input type="checkbox" v-model="useCorrectionBolus"
                @change="valueChanged">{{ $t('useCorrectionBolus') }}
            <ControllerConfig ref="correctionBolus" 
                :id="'CorrectionBolus'" :version="'2.0.0'" 
                :class="{disabled: !useMealBolus || !useCorrectionBolus}" 
                @controllerChanged="valueChanged"/>
        </div>
    </div>
</template>


<style scoped>
.disabled {
	pointer-events: none;
    opacity: 0.4;
}
.boolean-parameter {
    text-align: left;
}
</style>


<i18n locale="en">
{
	"name": "Only meal bolus with correction",
    "useMealBolus": "administer meal bolus",
    "useCorrectionBolus": "apply correction factor",

	"carbFactor": "carb factor",
	"premealTime": "time between bolus and meal",
}
</i18n>

<i18n locale="de">
{
	"name": "Mahlzeitenbolus mit Korrektur",
    "useMealBolus": "Bolus zur Mahlzeit",
    "useCorrectionBolus": "Korrekturfaktor verwenden",

	"carbFactor": "KE-Faktor",
	"premealTime": "Spritz-Ess-Abstand",
    
}
</i18n>
