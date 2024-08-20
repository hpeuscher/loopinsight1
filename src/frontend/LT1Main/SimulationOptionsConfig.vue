<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import ParameterConfig from './ParameterConfig.vue'
import AccordionBox from './AccordionBox.vue'
import { ParameterDescriptions, ParameterValues } from '../../types/ParametricModule.js'
import { ModuleTranslationList } from '../../types/ModuleProfile.js'


const i18n: ModuleTranslationList = {
    en: {
        "general": 		"General options",
        "t0": 			"Simulation start",
        "tspan": 		"Simulation timespan",
        "seed":         "Random seed",
        "dt":           "Maximum time step",
    },
    de: {
        "general":		"Allgemein",
        "t0": 			"Beginn",
        "tspan":		"Zeitraum",
        "seed":         "Zufallszahl (Seed)",
        "dt":           "Maximale Schrittweite",
    }
}


/** Component for configuration of simulator options. */
export default defineComponent({

    emits: ["valueChanged"],

    components: {
        AccordionBox,
        ParameterConfig,
    },

    computed: {
        config() {
            const config: ParameterDescriptions = {
                t0: { default: new Date(new Date(Date.now()).setHours(0,0,0,0)) },
                tspan: { unit: "h", default: 24, increment: 4 },
                seed: { unit: "", default: 1, increment: 1 },
                dt: { unit: "min", default: 5, increment: 1 },
            }
            return config
        },
        description() {
            return i18n[this.$i18n.locale]
        }
    },

    methods: {
        getParameterValues(): ParameterValues {
            const paramConfig = <InstanceType<typeof ParameterConfig>>
                this.$refs.paramConfig
            if (typeof paramConfig === "undefined") {
                return {}
            }
            const params = paramConfig.getParameterValues()
            const MS_PER_HOUR = 3600e3
            const t0 = <Date>params.t0
            const tspan = <number>params.tspan
            params.tmax = new Date(t0.valueOf() + tspan * MS_PER_HOUR)
            return params
        },

        valueChanged(): void {
            this.$emit("valueChanged", this.getParameterValues())
        },
    }
})
</script>


<template>
    <AccordionBox :title="$t('general')">
        <ParameterConfig ref="paramConfig" :config="config" @valueChanged="valueChanged"
            :description="description"
         />
    </AccordionBox>
</template>


<i18n locale="en">
{
	"general": 		"General options",
    "t0": 			"Simulation start",
	"tspan": 		"Simulation timespan",
}
</i18n>

<i18n locale="de">
{
	"general":		"Allgemein",
    "t0": 			"Simulationsbeginn",
	"tspan":		"Simulationszeitraum",
}
</i18n>
