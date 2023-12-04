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
        defaultValue: Date,
        id: String,
        description: String,
        tooltip: String,
    },

    data() {
        return {
            dateString: ""
        }
    },

	watch: {
		"defaultValue": {
            handler: function (val: Date) {
                const MS_PER_MIN = 60e3
                this.dateString = (new Date(val.getTime() 
                    - val.getTimezoneOffset() * MS_PER_MIN)
                    .toISOString()).slice(0, -1)
            },
            immediate: true,
		},
	},

    methods: {
        valueChanged() {
            this.$emit("valueChanged", new Date(this.dateString))
        },
    },
})
</script>


<template>
    <li class="parameterlist-item">
        <label :for="'param' + id">
            <div class="item-description" v-tooltip="{ content: tooltip }">
                <span v-html="description"></span>
            </div>
            <div class="item-input">
                <input type="datetime-local"
                    :id="'param' + id" 
                    v-model=dateString
                    @change="valueChanged">
            </div>
        </label>
    </li>
</template>

<style scoped>
input[type=datetime-local] {
    /*letter-spacing: -0.03em;*/
    width: 12em;
    grid-column: 2 / span 2;
    text-align: left;
}
</style>