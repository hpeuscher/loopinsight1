<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType, toRaw } from 'vue'
import { PatientProfile } from '../../../types/Patient.js'
import MealBolusWithCorrection from './MealBolusWithCorrection.vue'
import ControllerUnion from '../../../core/ControllerUnion.js'
import Controller from '../../../types/Controller.js'
import ControllerConfig from '../ControllerConfig.vue'

export const profile = {
    id: "BasalBolus",
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
        MealBolusWithCorrection,
    },

    methods: {
        getController(): Controller {
            const mealBolus = <InstanceType<typeof MealBolusWithCorrection>>
                this.$refs.MealBolus
            const CSII = <InstanceType<typeof ControllerConfig>>this.$refs.CSII
            return new ControllerUnion([
                toRaw(mealBolus.getController()),
                toRaw(CSII.getController()),
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
        <ControllerConfig ref="CSII" :id="'CSII'" :version="'2.0.0'" 
            :patientProfile="patientProfile" @controllerChanged="onControllerChanged" />
        <MealBolusWithCorrection ref="MealBolus" 
            :patientProfile="patientProfile" @controllerChanged="onControllerChanged" />
    </div>
</template>


<i18n locale="en">
{
	"name": "basal + bolus",
}
</i18n>
<i18n locale="de">
{
	"name": "Basal + Bolus",
}
</i18n>
