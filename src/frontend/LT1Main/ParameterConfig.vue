<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType } from 'vue'
import ParameterConfigObject from './ParameterConfigObject.vue'
import { ModuleTranslation } from '../../types/ModuleProfile.js'
import {
    ParameterDescriptions, ParameterValues
} from '../../types/ParametricModule.js'

export default defineComponent({
    components: {
        ParameterConfigObject
    },

    emits: ["valueChanged"],

    props: {
        /** configuration including units, defaults, ... */
        config: {
            type: Object as PropType<ParameterDescriptions>,
            required: true
        },
        /** default values of parameters */
        defaultValue: {
            type:  Object as PropType<ParameterValues>,
            required: false
        },
        /** text to display in first column of parameter list */
        description: Object as PropType<ModuleTranslation>,
        /** tooltip texts for further info on description */
        tooltip: Object as PropType<ModuleTranslation>,
    },

    
    methods: {

        setConfig(newConfig: ParameterDescriptions) {
            const paramConfig = <InstanceType<typeof ParameterConfigObject>>this.$refs.paramConfig
            paramConfig.setConfig(newConfig)
        },

        getParameterValues() {
            const paramConfig = <InstanceType<typeof ParameterConfigObject>>this.$refs.paramConfig
            return paramConfig.getParameterValues?.()
        },

        setParameterValues(parameters: ParameterValues): void {
            const paramConfig = <InstanceType<typeof ParameterConfigObject>>
                this.$refs.paramConfig
            paramConfig.setParameterValues(parameters)
        },

        valueChanged(args: Object) {
            this.$emit("valueChanged", args)
        }
    },
})
</script>


<template>
    <div class="parameterlist">
        <ul>
            <ParameterConfigObject ref="paramConfig" :config="config" :defaultValue="defaultValue"
                :description="description" :tooltip="tooltip" @valueChanged="valueChanged" />
            <slot></slot>
        </ul>
    </div>
</template>


<style>
/* parameter list container */
.parameterlist {
    display: block;
    /*	grid-template-columns: 200px 5.5rem auto;
	grid-template-rows: auto;
	grid-row-gap: 10px;
	align-items: center;*/
    margin-bottom: 1em;
}

.parameterlist-item {
    font-size: 0.9rem;
    display: grid;
    grid-template-columns: 40% 5.5rem auto;
    grid-template-rows: auto;
    align-items: center;
    margin-bottom: 0.5em;
}

.parameterlist hr {
    width: 80%;
}

.parameterlist ul {
    padding: 0;
    width: 100%;
}

.parameterlist li {
    list-style-type: none;
    width: 100%;
}

.parameterlist>div {
    display: inline-grid
}

.item-description {
    text-align: left;
}

.item-input input {
    width: 95%;
}
</style>
