<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType, toRaw } from 'vue'
import ParameterConfigBoolean from './ParameterConfigBoolean.vue'
import ParameterConfigDate from './ParameterConfigDate.vue'
import ParameterConfigNumber from './ParameterConfigNumber.vue'
import ParameterConfigArray from './ParameterConfigArray.vue'
import ParametricModule, {
    ParameterValues,
    ParameterDescriptions,
    ParameterValue,
} from '../../types/ParametricModule.js'
import { ModuleTranslation } from '../../types/ModuleProfile.js'
import { ParametricModuleBuilder } from '../../core/AbstractParametricModule.js'

export default defineComponent({
    name: "ParameterConfigObject",

    emits: ["valueChanged"],

    components: {
        ParameterConfigBoolean,
        ParameterConfigDate,
        ParameterConfigNumber,
        ParameterConfigArray,
    },

    props: {
        /** parameter id */
        id: String,
        /** configuration including units, defaults, ... */
        config: {
            type: Object as PropType<ParameterDescriptions>,
            required: true
        },
        /** default values of parameters */
        defaultValue: {
            type: Object as PropType<ParameterValues>,
            required: false,
        },
        /** text to display in first column of parameter list */
        description: Object as PropType<ModuleTranslation>,
        /** tooltip texts for further info on description */
        tooltip: Object as PropType<ModuleTranslation>,
    },

    data() {
        return {
            module: {} as ParametricModule
        }
    },

    watch: {
        config: {
            handler: function (val: ParameterDescriptions) {
                this.setConfig(val)
            },
            immediate: true,
            deep: true,
        },

        defaultValue: {
            /** module parameters have been changed on higher level, use these */
            handler: function (val: ParameterValues) {
                // console.log("default value changed")
                // console.log(val)
                this.setParameterValues(val)
            },
            deep: true,
        },
    },

    mounted() {
        this.valueChanged()
    },

    methods: {

        setConfig(newConfig: ParameterDescriptions) {
            // console.log("setConfig")
            this.module = ParametricModuleBuilder(() => newConfig)
            if (typeof this.defaultValue !== "undefined") {
                this.setParameterValues(this.defaultValue)
            }
        },

        getParameterValues() {
            return this.module.getParameterValues()
        },

        setParameterValue(id: string, value: any): void {

            // if (this.getParameterValues()[id] !== value) {
            if (JSON.stringify(this.getParameterValues()[id]) !== JSON.stringify(value)) {
                console.log("setting '" + id + "' to " + value)
                this.module.setParameterValues({ [id]: value })
                this.valueChanged()
            }
            // else
            //     console.log("ignoring '" + id + "' to " + value)
        },

        setParameterValues(parameters: ParameterValues): void {
            if (typeof parameters === "object" && Object.keys(parameters).length > 0) {
                this.module.setParameterValues(parameters)
                this.valueChanged()
            }
        },

        valueChanged() {
            // console.log("in "+this.id+", value of parameter "+this.id+" changed - emit")
            // console.log(toRaw(this.getParameterValues()))
            this.$emit("valueChanged", this.getParameterValues())
        },

        /** return html representation of parameter with given id */
        parameterDescription(id: string) {
            return this.description?.[id] ??
                ((id === "_") ? this.id :
                    this.parameterType(id) === "ParameterConfigObject" ? {} : id)

        },

        /** return tooltip description of parameter with given id */
        parameterTooltip(id: string) {
            return this.tooltip?.[id] ??
                (this.parameterType(id) === "ParameterConfigObject" ? {} : "")
        },

        /** return component type to process parameter */
        parameterType(id: string): string {
            // TODO: type "string"
            const value = this.config[id]?.default
            if (typeof value === "undefined")
                return ""
            if (typeof value === "number")
                return "ParameterConfigNumber"
            if (typeof value === "boolean")
                return "ParameterConfigBoolean"
            if (Object.prototype.toString.call(value) === "[object Date]")
                return "ParameterConfigDate"
            if (Array.isArray(value)) {
                return "ParameterConfigArray"
            }
            return "ParameterConfigObject"
        },

        /** return parameter configuration */
        parameterConfig(id: string): ParameterValue | ParameterDescriptions {
            if (Array.isArray(this.config[id].default)) {
                return this.config[id]
            }
            else if (typeof this.config[id].default === "object") {
                return this.config[id].default
            }
            else {
                return this.config[id]
            }
        },
    },
})
</script>


<template>
    <li v-if="parameterDescription('_')">
        <div :class="{ 'item-description': true }">
            {{ parameterDescription("_") }}
        </div>
        <div></div>
        <div></div>
    </li>
    <li>
        <component v-for="(_cfg, id) in config" 
            :is=parameterType(id) 
            :id=id 
            :config="parameterConfig(id)"
            :defaultValue="getParameterValues()[id]" 
            :description="parameterDescription(id)"
            :tooltip="parameterTooltip(id)"
            @valueChanged="(value: ParameterValue) => { setParameterValue(id, value) }" />
    </li>
</template>
