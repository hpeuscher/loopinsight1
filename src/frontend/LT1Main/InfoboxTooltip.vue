<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import Colors from '../util/Colors.js'

export default defineComponent({
    props: {
        description: String,
        tooltip: String,
    },
    computed: {
        color() { return Colors.THUBlue }
    },
})
</script>

<template>
    <div v-tooltip="{ content: tooltip }">
        <span v-html="description" class="description"></span>
        <svg v-if="tooltip" class="infobox-tooltip" version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 46 46" xml:space="preserve" >
            <g>
                <path d="M39.264,6.736c-8.982-8.981-23.545-8.982-32.528,0c-8.982,8.982-8.981,23.545,0,32.528c8.982,8.98,23.545,8.981,32.528,0 C48.245,30.281,48.244,15.719,39.264,6.736z M25.999,33c0,1.657-1.343,3-3,3s-3-1.343-3-3V21c0-1.657,1.343-3,3-3s3,1.343,3,3V33z M22.946,15.872c-1.728,0-2.88-1.224-2.844-2.735c-0.036-1.584,1.116-2.771,2.879-2.771c1.764,0,2.88,1.188,2.917,2.771 C25.897,14.648,24.746,15.872,22.946,15.872z"></path>
            </g>
        </svg>
    </div>
</template>

<style scoped>
.infobox-tooltip {
    fill: v-bind("color");
    height:1em;
}
.description {
    margin-right: 0.5em;
}
</style>
