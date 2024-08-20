<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType } from 'vue';
import {
    ParameterDescription,
    ParameterValue,
} from '../../types/ParametricModule.js';
import ParameterConfigNumber from './ParameterConfigNumber.vue';

export default defineComponent({
    name: "ParameterConfigObject",

    emits: ["valueChanged"],

    components: {
        ParameterConfigNumber,
    },

    props: {
        /** parameter id */
        id: String,
        /** configuration including units, defaults, ... */
        config: {
            type: Object as PropType<ParameterDescription>,
            required: true,
        },
        /** default values of parameters */
        defaultValue: { 
            type: Object as PropType<number[]>,
            required: true,
        },
        /** text to display in first column of parameter list */
        description: String,
        /** tooltip texts for further info on description */
        tooltip: String,
    },

    data() {
        return {
            value: [] as ParameterValue[]
        }
    },

    watch: {

        defaultValue: {
            /** module parameters have been changed on higher level, use these */
            handler: function (val: ParameterValue[]) {
                // console.log("default value changed")
                // console.log(val)
                this.value = val
                this.valueChanged()
            },
            deep: true,
            immediate: true,
        },
    },

    mounted() {
        this.valueChanged()
    },

    methods: {

        setValue(id: number, value: ParameterValue) {
            if (this.value[id] !== value) {
                this.value[id] = value
                this.valueChanged()
            }
        },

        valueChanged() {
            this.$emit("valueChanged", this.value)
        },

    },
})
</script>


<template>
    <li>
        <label :for="'param' + id">
            <div class="item-description" v-tooltip="{ content: tooltip }">
                <span v-html="description"></span>
            </div>
            <div></div>
            <div></div>
        </label>
    </li>
    <li>
        <ParameterConfigNumber v-for="(_cfg, _id, id) in defaultValue" 
            :config="config"
            :defaultValue="defaultValue[_id]" 
            :tooltip="tooltip"
            @valueChanged="(value: ParameterValue) => { setValue(_id, value) }" />
    </li>
</template>
