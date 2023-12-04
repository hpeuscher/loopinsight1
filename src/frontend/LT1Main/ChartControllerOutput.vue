<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import AccordionBox from './AccordionBox.vue'
import { ControllerInternals } from '../../types/Controller.js'

export default defineComponent({
    components: {
        AccordionBox,
    },
    data() {
        return {
            log: {} as ControllerInternals,
            t0: "",
        }
    },
    methods: {
        reset() {
            this.log = {}
            this.t0 = ""
        },
        controllerDataHover(t0: Date, data: any) {
            this.t0 = t0.toLocaleString()
            this.log = data
        },
    },
    computed: {
        reason() {
            return this.log?.reason || ""
        },
        debug() {
            return this.log?.debug || ""
        },
    }
})
</script>


<template>
    <AccordionBox :title="$t('title')" :initial="true">
        <div id="controllerOutput">
            <h4>{{ $t("time") }}: {{ t0 }}</h4>
            <h4 v-if="reason?.length > 0">{{ $t('reason') }}</h4>
            <div id="controllerReason">
                <p v-for="r of reason">{{ r }}</p>
            </div>
            <h4 v-if="debug?.length > 0">{{ $t('debug') }}</h4>
            <div id="controllerDebug">
                <p v-for="r of debug">{{ r }}</p>
            </div>
        </div>
    </AccordionBox>
</template>


<style lang="css" scoped>
#controllerOutput {
    font-size: 0.85rem;
    font-family: Courier;
    margin: 1rem;
    padding: 0.5rem;
    border: solid 1px;
    background-color: #eeeeee;
    text-align: left;
}

p {
    margin-top: 0;
    margin-bottom: 0;
    margin-left: 1rem;
}
</style>


<i18n locale="en">
{
	"title":	"Algorithm outputs and logs",
	"time":		"time",
    "reason":   "Reason",
    "debug":    "Debugging output",
}
</i18n>
<i18n locale="de">
{
	"title": 	"Algorithmus-Ausgaben und -Logs",
	"time":		"Zeitpunkt",
    "reason":   "Begründung",
    "debug":    "Debug-Ausgabe",
}
</i18n>
