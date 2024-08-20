<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType } from 'vue'
import DailyProfile from '../../common/DailyProfile.js'
import { ParameterDescription } from '../../types/ParametricModule.js'
import countDecimals from '../util/CountDecimals.js'
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
        toProfile() {
            this.$emit("valueChanged", new DailyProfile([[0, this.value]]))
        }
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
            <svg v-tooltip="{ content: $t('toProfile') }" 
                @click="toProfile"
                class="profile-symbol" 
                version="1.1"
                xmlns="http://www.w3.org/2000/svg" 
                xmlns:xlink="http://www.w3.org/1999/xlink" 
                viewBox="0 0 46 46"
                xml:space="preserve" >
                <circle cx="23" cy="23" r="22"  />
                <polyline points="5,30 15,20 24,35 32,10 40,20"  
                    stroke="white" 
                    stroke-width="3" 
                    fill="none" />
            </svg>
        </div>
        <div class="item-unit">{{ unit }}</div>
        <slot></slot>
    </li>
</template>

<style>
.profile-symbol {
    fill: #0055A3;
    height:1em;
}
</style>


<i18n locale="en">
{
    "toProfile"			: "Click to convert to daily profile (Warning - experimental!)",
}
</i18n>

<i18n locale="de">
{
    "toProfile"			: "Klicken, um in ein Tagesprofil umzuwandeln (Achtung, experimentell!)",
}
</i18n>
    