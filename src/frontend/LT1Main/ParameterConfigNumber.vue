<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType } from 'vue'
import countDecimals from '../util/CountDecimals.js'
import { ParameterDescription } from '../../types/ParametricModule.js'
import InfoboxTooltip from './InfoboxTooltip.vue'

export default defineComponent({
    emits: ["valueChanged"],
    props: {
        config: {
            type: Object as PropType<ParameterDescription>,
            required: true,
        },
        defaultValue: {
            type: Number,
            required: true,
        },
        id: String,
        description: String,
        tooltip: String,
    },
    data() {
        return {
            value: NaN
        };
    },
    computed: {
        stepDistance(): number {
            return Math.pow(10, countDecimals(this.defaultValue || 1))
        },
        min(): number {
            return this.config?.min ?? -Infinity
        },
        max(): number {
            return this.config?.max ?? +Infinity
        },
        step(): number {
            return this.config?.increment || this?.stepDistance || 0
        },
        unit(): string {
            return this.config?.unit || ""
        },
    },
    watch: {
        defaultValue: {
            handler: function (val: number) {
                if (val !== this.value && typeof val !== "undefined") {
                    // console.log("change number to " + val)
                    this.value = val
                    this.valueChanged()
                }
            },
            immediate: true,
        },
    },
    methods: {
        valueChanged() {
            this.$emit("valueChanged", this.value)
        },
    },
    components: { InfoboxTooltip }
})
</script>


<template>
    <li class="parameterlist-item">
        <div class="item-description">
            <InfoboxTooltip :description="description" :tooltip="tooltip" />
        </div>
        <div class="item-input">
            <input type="number" v-model.number=value
                :id="'param' + id" 
                :min="min"
                :max="max"
                :step="step"
                @change="valueChanged()">
        </div>
        <div class="item-unit">{{ unit }}</div>
        <slot></slot>
    </li>
</template>

<style scoped>
.item-unit {
    font-size: 0.9em;
    padding-left: 1em;
    text-align: left;
}
</style>
