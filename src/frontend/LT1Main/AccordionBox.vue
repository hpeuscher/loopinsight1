<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'

export default defineComponent({
    props: {
        title: String,
        initial: Boolean,
    },

    data() {
        return {
            boxactive: this.initial,
        }
    },
})
</script>


<template>
    <div :class="{ accordionbox: true, boxactive }">
        <h3 @click="[boxactive = !boxactive]">{{ title }}</h3>
        <div class="accordioncontent">
            <slot></slot>
        </div>
    </div>
</template>


<style scoped>
.accordionbox {
    border: solid;
    border-width: 1px;
    border-color: #aaaaaa;
    padding: .5rem;
    margin-top: 0.5rem;
    display: grid;
    grid-template-rows: 1rem 0fr;
    transition: grid-template-rows 0.5s;
}

.boxactive {
    grid-template-rows: 2rem 1fr !important;
}

div.accordioncontent {
    overflow: hidden;
}

h3 {
    font-size: 1rem;
    line-height: 1rem;
    font-weight: bold;
    position: relative;
    margin-bottom: 1rem;
    color: #586067;
    background-color: #f4f4ff;
    width: 100%;
    padding: .5rem;
    margin: -.5rem;
    height: 1rem;
    border-bottom: 1px solid #aaaaaa;
    box-sizing: content-box;
}

/* arrow to open or close box content */
.accordionbox h3::after {
    position: absolute;
    right: 0.5rem;
    transition: all 0.5s;
    content: "\25BC";
}

.boxactive h3::after {
    transform: scaleY(-1);
}
</style>
