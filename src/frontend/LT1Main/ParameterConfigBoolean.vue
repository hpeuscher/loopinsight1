<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType } from 'vue'
import { ParameterDescription } from '../../types/ParametricModule.js'


export default defineComponent({
    emits: ["valueChanged"],

    props: {
        config: {
            type: Object as PropType<ParameterDescription>,
            required: true
        },
        defaultValue: Boolean,
        id: String,
        description: String,
        tooltip: String,
    },

    data() {
        return {
            value: this.defaultValue
        }
    },


	watch: {
		"defaultValue": {
            handler: function (val: boolean) {
                this.value = val
            },
            immediate: true,
		},
	},

    methods: {
        valueChanged() {
            this.$emit("valueChanged", this.value)
        },
    },
})
</script>


<template>
    <li class="parameterlist-item parameterlist-item-boolean">
        <div class="item-input">
            <input type="checkbox" v-model=value :id="'param' + id"
                @change="valueChanged()">
        </div>
        <div class="item-description" v-tooltip="{ content: tooltip }">
            <span v-html="description"></span>
        </div>
        <slot></slot>
    </li>
</template>

<style>
.parameterlist-item-boolean > .item-description {
    grid-column: 2 / span 2;
}
</style>