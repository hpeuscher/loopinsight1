<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import {defineComponent, toRaw} from 'vue'
import ControllerConfig from '../ControllerConfig.vue'
import ControllerMealBolus from '../../../core/controllers/MealBolus.js'
import Controller from '../../../types/Controller.js'

export const profile = {
	id: "MealBolus",
	version: "2.0.0",
}

/** Configuration for meal bolus controller. */
export default defineComponent({
	components: {
        ControllerConfig
    },

    emits: ["controllerChanged"],

	data() {
		return {
			useMealBolus: true,
		}
	},

	methods: {
        getController(): Controller {
            if (!this.useMealBolus) {
                return new ControllerMealBolus({carbFactor: 0})
            }
            const mealBolus = <InstanceType<typeof ControllerConfig>>
                this.$refs.mealBolus
            return toRaw(mealBolus.getController())
        },

        valueChanged() {
            this.$emit('controllerChanged', this.getController())
        },
	},
})
</script>


<template>
    <div class="boolean-parameter">
        <input type="checkbox" v-model="useMealBolus"
            @change="valueChanged">{{ $t('useMealBolus') }}
        <ControllerConfig ref="mealBolus" 
            :id="'MealBolus'" :version="'2.0.0'" 
            :class="{disabled: !useMealBolus}"
            @controllerChanged="valueChanged"/>
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
	"name": "Only meal bolus",
    "useMealBolus": "Administer meal bolus",
}
</i18n>

<i18n locale="de">
{
	"name": "Nur Mahlzeitenbolus",
    "useMealBolus": "Bolus zur Mahlzeit",
}
</i18n>
