<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import SVGChart from './SVGChart.vue'
import StructureDiagram from '../../types/StructureDiagram.js'

export default defineComponent({
    data() {
        return {
            diagram: {} as StructureDiagram
        }
    },

    components: {
        SVGChart
    },

    mounted() {
        const node_u = document.getElementById("node_u")!
        node_u.parentNode!.appendChild(node_u)
    },

    beforeMount() {

        this.diagram = <StructureDiagram>{
            nodes: {
                "Patient": { x: 200, y: 100, geometry: { shape: "ellipse", dx: 150, dy: 80 } },
                "Sensors": { x: 400, y: 200, geometry: { shape: "ellipse", dx: 150, dy: 80 } },
                "Controller": { x: 200, y: 300, geometry: { shape: "ellipse", dx: 150, dy: 80 } },
                "Actuators": { x: 0, y: 200, geometry: { shape: "ellipse", dx: 150, dy: 80 } },

                "u": { x: 100, y: 100, geometry: { shape: "circle", d: 30 }, class: "signal" },
                "x": { x: 200, y: 150, geometry: { shape: "circle", d: 30 }, class: "signal" },
                "y": { x: 410, y: 120, geometry: { shape: "circle", d: 30 }, class: "signal" },
                "s": { x: 410, y: 280, geometry: { shape: "circle", d: 30 }, class: "signal" },
                "c": { x: -10, y: 280, geometry: { shape: "circle", d: 30 }, class: "signal" },

            },
            connections: [
                { from: { id: "Patient", angle: 0 }, to: { id: "Sensors", angle: 90 }, type: "arrow", label: { text: "PatientOutput", at: -0.8 } },
                { from: { id: "Sensors", angle: -90 }, to: { id: "Controller", angle: 0 }, type: "arrow", label: { text: "Measurement", at: -0.15 } },
                { from: { id: "Controller", angle: 180 }, to: { id: "Actuators", angle: -90 }, type: "arrow", label: { text: "ControllerOutput", at: 0.7 } },
                { from: { id: "Actuators", angle: 90 }, to: { id: "Patient", angle: 180 }, type: "arrow", label: { text: "Medication", at: 0.1 } },
                { from: { x: 0, y: 65, angle: -20 }, to: { id: "Patient", angle: 175 }, type: "arrow", label: { text: "Disturbance", at: -0.1 } },
                { from: { x: 390, y: 340, angle: 160 }, to: { id: "Controller", angle: -5 }, type: "arrow", label: { text: "Announcement", at: -0.5 } },
            ],
            htmlStrings: html[this.$i18n.locale],
            tooltipStrings: tooltips[this.$i18n.locale],
        }

    },

})

export const html: any = {
    en: {
        "Patient": "Patient<br/>physiology",
        "Sensors": "Sensors",
        "Controller": "Controller",
        "Actuators": "Actuators",
    },
    de: {
        "Patient": "Patienten-<br/>physiologie",
        "Sensors": "Sensoren",
        "Controller": "Controller",
        "Actuators": "Aktoren",
    },
}

export const tooltips: any = {
    en: {
        //		"Patient"	    : "Patient<br/>physiology",
        //		"Sensors"	    : "Sensors",
        //		"Controller"	: "Controller",
        //		"Actuators"	    : "devices like an insulin pump, a pen, intra",
        "u": "Patient inputs u: the union of treatments and disturbances<br/><br/>iir: actual insulin infusion rate<br/>ibolus: actual insulin bolus<br/>carbs: carb intake<br/>meal: total meal amount<br/>exercise: physical activity",
        "x": "patient state x: state variables of physiological model",
        "y": "Patient outputs y: physiological quantities that can be sensed<br/><br/>Gp: plasma glucose concentration<br/>Gt: tissue glucose concentration",
        "s": "Measurements s<br/><br/>CGM: subcutaneous glucose measurement<br/>SMBG: self-measured blood glucose<br/>IV: intravenous blood glucose",
        "m": "Controller outputs m:<br/><br/>iir: insulin infusion rate<br/>ibolus: insulin bolus ",
    },
}

</script>


<template>
    <div>
        <SVGChart :diagram="diagram" />
    </div>
</template>


<style lang="css">
html {
    font-family: Calibri;
    font-weight: 400;
    font-size: 16px;
}

.signal>circle {
    stroke: #0055a3;
    stroke-width: 2;
    fill: #ffffff;
    pointer-events: visible;
    z-index: 1000;
}

.signal>foreignObject>div {
    color: #0055a3;

}
</style>
