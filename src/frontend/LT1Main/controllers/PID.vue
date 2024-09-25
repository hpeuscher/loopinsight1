<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType, toRaw } from 'vue'
import Patient, { PatientProfile } from '../../../types/Patient.js'
import ControllerConfig from '../ControllerConfig.vue'
import MealBolus from './MealBolus.vue'
import ControllerUnion from '../../../core/ControllerUnion.js'
import Controller from '../../../types/Controller.js'

export const profile = {
    id: "PID",
    version: "2.0.0",
}

export default defineComponent({
    props: {
        patientProfile: {
            type: Object as PropType<PatientProfile>,
            required: true,
        },
    },

    emits: ["controllerChanged"],

    components: {
        ControllerConfig,
        MealBolus,
    },

    methods: {
        getController(): Controller {
            // TODO: first check if ALL parts of ControllerUnion are valid            
            const mealBolus = <InstanceType<typeof MealBolus>>this.$refs.MealBolus
            const PID = <InstanceType<typeof ControllerConfig>>this.$refs.PID
            return new ControllerUnion([
                toRaw(mealBolus.getController()),
                toRaw(PID.getController()),
            ])
        },

        onControllerChanged() {
            this.$emit("controllerChanged", this.getController())
        },

    },
})
</script>


<template>
    <MealBolus ref="MealBolus" :patientProfile="patientProfile" @controllerChanged="onControllerChanged" />
    <hr>
    <ControllerConfig ref="PID" :id="'PID'" :patientProfile="patientProfile" @controllerChanged="onControllerChanged" />
</template>


<i18n locale="en">
{
	"name": "PID controller + bolus",
}
</i18n>
<i18n locale="de">
{
	"name": "PID-Regler + Bolus",
}
</i18n>
