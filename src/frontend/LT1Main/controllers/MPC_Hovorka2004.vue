<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import {defineComponent, PropType, toRaw} from 'vue'
import ControllerConfig from '../ControllerConfig.vue'
import { PatientProfile } from '../../../types/Patient.js'

export const profile = {
	id: "MPC_Hovorka2004",
	version: "2.1.0",
}

export default defineComponent({
    props: {
        patientProfile: {
            type: Object as PropType<PatientProfile>,
            required: true,
        },
    },

	components: {
        ControllerConfig
    },

    methods: {
        getController() {
            const MPC = <InstanceType<typeof ControllerConfig>>
                this.$refs.MPC_Hovorka2004
            return toRaw(MPC.getController())
        }
    }
})
</script>


<template>
    <ControllerConfig ref="MPC_Hovorka2004" :id="'MPC_Hovorka2004'" :version="'2.1.0'" 
    :patientProfile="patientProfile" />
</template>


<i18n locale="en">
{
	"name": "MPC (Hovorka 2004)",
}
</i18n>

<i18n locale="de">
{
	"name": "MPC (Hovorka 2004)",
}
</i18n>
