<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import Chart from 'chart.js/auto'
import { defineComponent, PropType, toRaw } from 'vue'
import DailyProfile from '../../common/DailyProfile.js'
import { ParameterDescription } from '../../types/ParametricModule.js'
import InfoboxTooltip from './InfoboxTooltip.vue'

export default defineComponent({

    setup() {
        const chart = {} as Chart
        return { chart }
    },

    components: { InfoboxTooltip },

    emits: ["valueChanged"],

    props: {
        config: {
            type: Object as PropType<ParameterDescription>,
            required: true,
        },
        defaultValue: {
            type: Object as PropType<DailyProfile>,
            default: () => new DailyProfile([[0, 0]])
        },
        id: String,
        description: String,
        tooltip: String,
    },

    watch: {
        defaultValue: {
            handler: function (val: DailyProfile) {
                // clone new default object
                this.profile = DailyProfile.fromJSON(
                    JSON.parse(JSON.stringify(val)))
                this.interpolationMethod = val.method
                this.valueChanged()
            },
            immediate: true,
        },
    },


    computed: {
        canvasid(): string {
            return 'canvas' + this.id
        },
        points(): Array<[number, number]> {
            return this.profile.nodes
        },
        unit(): string {
            return this.config?.unit || ""
        },
    },

    data() {
        return {
            profile: this.defaultValue,
            interpolationMethod: this.defaultValue.method,
        }
    },

    mounted() {
        const id = this.canvasid
        const canvas = document.getElementById(id) as HTMLCanvasElement
        const ctx = canvas.getContext('2d')!

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    data: [],
                    borderColor: '#0055A3',
                    borderWidth: 2,
                    tension: 0.5,
                    pointHoverRadius: 0,
                },
                ]
            },

            options: {
                layout: {
                    padding: { left: 20, right: 10 },
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        ticks: { stepSize: 4 },
                        min: 0,
                        max: 24,
                    },
                },
                plugins: {
                    tooltip: {
                        enabled: false,
                    },
                    legend: {
                        display: false
                    },
                },
            },
        })

        this.valueChanged()

        // reaction to clicks
        canvas.addEventListener('mousedown', (event) => {
            // transform coordinates
            const rect = canvas.getBoundingClientRect()
            const x_ = event.clientX - rect.left
            const y_ = event.clientY - rect.top

            const x = this.chart.scales.x.getValueForPixel(x_)!
            const y = this.chart.scales.y.getValueForPixel(y_)!

            if (event.button === 0) {
                // left button -> add
                this.profile.insertNode([x, y])
                this.valueChanged()
            }
            else if (event.button === 2) {
                // right button -> delete
                this.profile.removeNodeAt(x)
                this.valueChanged()
            }
        })
        canvas.oncontextmenu = () => false
    },

    methods: {
        valueChanged() {

            // use chosen interpolation method
            /** interpolation method (numeric) */
            const intMethod = Number(this.interpolationMethod)
            this.profile.method = intMethod

            // update visualized chart data
            if (this.chart.data) {
                this.chart.data.datasets[0].data = []
                for (let t = 0; t <= 24; t += 0.05) {
                    this.chart.data.datasets[0].data.push({
                        x: t, y: this.profile.getAtTOD(t)
                    })
                }
                // update chart
                this.chart.update()
            }

            // inform parent element
            this.$emit('valueChanged', toRaw(this.profile))
        }
    }
})
</script>

<template>
    <li class="parameterlist-item">
        <div class="item-description">
            <InfoboxTooltip :description="description" :tooltip="tooltip" />
        </div>
        <div class="item-input">&nbsp;</div>
        <div class="item-unit">{{ unit }}</div>
    </li>
    <li>
        <div style="width:100%;text-align: right;font-size: 0.9em;">
            {{ $t('intmethod') }}:
            <select v-model="interpolationMethod" @change="valueChanged">
                <option value="0">{{ $t('zero-order') }}</option>
                <option value="1">{{ $t('linear') }}</option>
                <option value="2">{{ $t('smoothstep') }}</option>
            </select>
            <InfoboxTooltip :tooltip="$t('explanation')" style="display:inline-block" />
        </div>
        <div>
            <canvas :id="canvasid"></canvas>
        </div>
    </li>
</template>


<style scoped>
canvas {
    width: 100%;
    height: 100px;
}

select {
    padding: 0px;
}
</style>

<i18n locale="en">
{
    "zero-order"		: "zero-order",
    "linear"			: "linear",
    "smoothstep"		: "smoothstep",
    "intmethod"	    	: "interpolation method",
    "explanation"       : "Click left to add/modify a point,\nclick right to remove point",
}
</i18n>

<i18n locale="de">
{
    "zero-order"		: "Stufe",
    "linear"			: "linear",
    "smoothstep"		: "Smoothstep",
    "intmethod"	    	: "Interpolationsmethode",
    "explanation"       : "Linke Maustaste zum Hinzufügen oder Verändern,\nrechte Maustaste zum Entfernen von Punkten",
}
</i18n>