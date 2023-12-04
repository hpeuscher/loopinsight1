<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType, toRaw } from 'vue'
import { PatientProfile } from '../../../types/Patient.js'
import MealBolus from './MealBolus.vue'
import ControllerUnion from '../../../core/ControllerUnion.js'
import Controller from '../../../types/Controller.js'
import ControllerConfig from '../ControllerConfig.vue'

export const profile = {
	id: "Oref0",
	version: "2.0.0",
}

export default defineComponent({
	props: {
        patientProfile: Object as PropType<PatientProfile>
    },

	emits: ["controllerChanged"],

    components: {
        ControllerConfig,
        MealBolus,
    },

	methods: {

        getController(): Controller {
            const mealBolus = <InstanceType<typeof MealBolus>>
                this.$refs.MealBolus
            const oref0 = <InstanceType<typeof ControllerConfig>>
                this.$refs.oref0
            
            return new ControllerUnion([
                toRaw(mealBolus.getController()),
                toRaw(oref0.getController()),
            ])
        },

        onControllerChanged() {
            this.$emit("controllerChanged", this.getController())
        },
	},
})
</script>


<template>
    <div>
        <MealBolus ref="MealBolus" :patientProfile="patientProfile" 
            @controllerChanged="onControllerChanged" />
        <hr/>
        <ControllerConfig ref="oref0" 
            :id="'Oref0'" :version="'2.0.0'" 
            :patientProfile="patientProfile"
            @controllerChanged="onControllerChanged"/>
    </div>
</template>


<i18n locale="en">
{
    "name": "OpenAPS (oref0)",
}
</i18n>
<i18n locale="de">
{
    "name": "OpenAPS (oref0)",
}
</i18n>