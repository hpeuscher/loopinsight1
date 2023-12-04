<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import {defineComponent, PropType, toRaw} from 'vue'
import ControllerConfig from '../ControllerConfig.vue'
import Patient from '../../../types/Patient.js'

export const profile = {
	id: "CSII",
	version: "2.0.0",
}

export default defineComponent({
    props: {
        patient: Object as PropType<Patient>,
    },

	components: {
        ControllerConfig
    },

    methods: {
        getController() {
            const CSII = <InstanceType<typeof ControllerConfig>>
                this.$refs.CSII
            return toRaw(CSII.getController())
        }
    }
})
</script>


<template>
    <ControllerConfig ref="CSII" :id="'CSII'" :version="'2.0.0'" 
        :patient="patient" />
</template>


<i18n locale="en">
{
	"name": "CSII (basal rate only)",
}
</i18n>

<i18n locale="de">
{
	"name": "CSII (nur Basalrate)",
}
</i18n>
