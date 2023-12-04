<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import { ModuleImportList, ModuleProfileList } from '../../types/ModuleProfile.js'
import { ParameterFileContents, ParameterFileList } from '../../types/ParameterFileContents.js'
import Actuator from '../../types/Actuator.js'
import AccordionBox from './AccordionBox.vue'
import ModuleConfig from './ModuleConfig.vue'
import DeviceSelection from './DeviceSelection.vue'

/** list of actuator models, provided by bundler */
declare var __LT1_LOCAL_ACTUATORS__: ModuleProfileList
/** list of actuator devices, provided by bundler */
declare var __LT1_LOCAL_ACTUATOR_DEVICES__: ParameterFileList

export default defineComponent({
    emits: ['valueChanged'],

    components: {
        AccordionBox,
        DeviceSelection,
        ModuleConfig,
    },

    data() {
        return {
            modelImports: {} as ModuleImportList,
        }
    },

    computed: {
        deviceInfo: function() { return __LT1_LOCAL_ACTUATOR_DEVICES__ },
        modelInfo: function() { return __LT1_LOCAL_ACTUATORS__ },
    },

    created() {
        // import module dynamically
        for (const id in this.modelInfo) {
            this.modelImports[id] = () => import(
                /* webpackChunkName: "actuators_[request]" */
                /* webpackMode: "lazy" */
                `../../core/actuators/${id}.ts`
            )
        }
    },

    methods: {
        getModule(): Actuator {
            const moduleConfig = <InstanceType<typeof ModuleConfig>>
                this.$refs.moduleConfig
            return <Actuator>moduleConfig.getModule()
        },

        deviceChanged(device: ParameterFileContents) {
            const moduleConfig = <InstanceType<typeof ModuleConfig>>
                this.$refs.moduleConfig
            moduleConfig.loadFromFile(device)
        },
    },
})
</script>


<template>
    <AccordionBox :title="$t('actuatorsettings')">
        <DeviceSelection :deviceInfo="deviceInfo" @valueChanged="deviceChanged" />
        <ModuleConfig ref="moduleConfig" 
            :type="'actuator'" 
            :modelInfo="modelInfo" 
            :modelImports="modelImports"
            :defaultModel="'StaticInsulinPump'" 
            @valueChanged="(args) => $emit('valueChanged', args)"
        />
    </AccordionBox>
</template>


<i18n locale="en">
{
	"actuatorsettings"		: "Insulin pump",
}
</i18n>

<i18n locale="de">
{
	"actuatorsettings"		: "Insulinpumpe",
}
</i18n>
