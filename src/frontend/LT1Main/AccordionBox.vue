<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent} from 'vue'

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
    <div :class="{box2: true, accordionbox: true, boxactive: boxactive }">
        <h3 @click="[boxactive = !boxactive]">{{ title }}</h3>
        <slot />
    </div>
</template>


<style scoped>
/* box that can be opened or closed */
.accordionbox {
    height: 1rem;
    overflow: hidden;
    box-sizing: content-box;
}

.boxactive {
    height: auto;
    overflow: visible;
}

/* arrow to open or close box content */
.lt1-container .accordionbox h3::after {
    position: absolute;
    font-size: 1.25rem;
    right: 0.5rem;
    /*    top: -.25em;*/
    transition: all 0.5s;
    content: "\27A6";
    transform: rotate(90deg);
}

.lt1-container .boxactive h3::after {
    content: "\27A5";
    transform: rotate(180deg);
}

</style>
