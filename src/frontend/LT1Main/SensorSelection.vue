<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent} from 'vue'
import { ModuleImportList, ModuleProfileList } from '../../types/ModuleProfile.js'
import { ParameterFileContents, ParameterFileList } from '../../types/ParameterFileContents.js'
import ModuleConfig from './ModuleConfig.vue'
import AccordionBox from './AccordionBox.vue'
import Sensor from '../../types/Sensor.js'
import DeviceSelection from './DeviceSelection.vue'

/** list of sensor models, provided by bundler */
declare var __LT1_LOCAL_SENSORS__: ModuleProfileList
/** list of sensor devices, provided by bundler */
declare var __LT1_LOCAL_SENSOR_DEVICES__: ParameterFileList

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
        deviceInfo: function() { return __LT1_LOCAL_SENSOR_DEVICES__ },
        modelInfo: function() { return __LT1_LOCAL_SENSORS__ },
    },
 
    created() {
        // import module dynamically
        for (const id in this.modelInfo) {
            this.modelImports[id] = () => import(
                /* webpackChunkName: "sensors_[request]" */
                /* webpackMode: "lazy" */
                `../../core/sensors/${id}.ts`
            )
        }
    },

    
    methods: {
        getModule(): Sensor {
            const moduleConfig = <InstanceType<typeof ModuleConfig>>
                this.$refs.moduleConfig
            return <Sensor>moduleConfig.getModule()
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
    <AccordionBox :title="$t('sensorsettings')">
        <DeviceSelection :deviceInfo="deviceInfo" @valueChanged="deviceChanged" />
        <ModuleConfig ref="moduleConfig"
            :type="'sensor'"
            :modelInfo="modelInfo"
            :modelImports="modelImports"
            :defaultModel="'Breton2008'"
            @valueChanged="(args) => $emit('valueChanged', args)"
        />
    </AccordionBox>
</template>


<i18n locale="en">
{
	"sensorsettings"		: "Sensor",
}
</i18n>

<i18n locale="de">
{
	"sensorsettings"		: "Sensor",
}
</i18n>
