<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import {defineComponent, PropType, ref, toRaw} from 'vue'
import { PatientProfile } from '../../types/Patient.js'
import AccordionBox from './AccordionBox.vue'
import ParameterConfig from './ParameterConfig.vue'
import ImportController from '../util/ImportController.js'
import Controller from '../../types/Controller.js'
import { ModuleTranslation } from '../../types/ModuleProfile.js'
import { ParameterDescriptions, ParameterValues } from '../../types/ParametricModule.js'

export default defineComponent({
    $refs: {
        paramConfig: ParameterConfig
    },
    
	emits: ["controllerChanged"],

    props: {
        id: {type: String, required: true},
        version: String,
        patientProfile: {
            type: Object as PropType<PatientProfile>, 
            required: false
        },
    },
	
	components: {
        AccordionBox,
        ParameterConfig,
    },

	data() {
		return {
            controller: {} as Controller,
            description: {} as ModuleTranslation,
            tooltip: {} as ModuleTranslation,
        }
	},

    computed: {
        /** return parameter descriptions for module */
        parameterDescription(): ParameterDescriptions {
            return this.controller?.getParameterDescription?.() ?? {}
        },

        /** 
         * return current parameter values.
         * This is used to transmit data top->down, e.g. when the patient
         * changes, the controller changes and its values must be transported
         * to the lower UI components.
         */
        values(): ParameterValues {
            return this.controller?.getParameterValues?.() ?? {}
        },

    },

	watch: {
        id: {
            handler: function () {
                this.loadControllerConfig()
            },
            immediate: true,
        },
		patientProfile: {
            handler: function () {
                this.patientChanged()
            },
            deep: true,
		},
	},

    // mounted() {
    //     this.loadControllerConfig()
    // },

	methods: {
        /** return controller */
        getController(): Controller {
            return toRaw(this.controller)
        },

            
        async loadControllerConfig() {
            if (this.id === "") {
                return
            }

            const moduleContents = await ImportController(this.id, this.version)
            if (typeof moduleContents === "undefined") {
                return
            }

            this.controller = new moduleContents.default()

            this.description = moduleContents.i18n_label?.[this.$i18n?.locale] ??
                moduleContents.html ?? {}

            this.tooltip = moduleContents.i18n_tooltip?.[this.$i18n?.locale] ?? {}

            const paramConfig = <InstanceType<typeof ParameterConfig>>this.$refs.paramConfig
            if (typeof paramConfig === "undefined")
                return
            paramConfig.setConfig(this.controller.getParameterDescription())
            this.controller.restoreDefaultParameterValues()

            // pass on patient info to controller
            this.patientChanged()
            // make sure the new controller is emitted
            // this.valueChanged()
            this.$emit("controllerChanged", this.getController())
        },

        

        /** callback after change of virtual patient */
		patientChanged() {
            if (typeof this.patientProfile !== "undefined") {
                this.controller.autoConfigure?.(this.patientProfile)
            }
		},
		
        /** callback after change of value on lower component */
		valueChanged(newParam: ParameterValues = {}) {
            if (typeof this.controller.setParameterValues === "function") {
                // check if parameter values have actually changed
                const oldParams = JSON.stringify(this.controller.getParameterValues())
                this.controller.setParameterValues(toRaw(newParam))
                const newParams = JSON.stringify(this.controller.getParameterValues())
                if (oldParams !== newParams) {
                    this.$emit("controllerChanged", this.getController())
                }
            }
		},
	},
})
</script>


<template>
    <ParameterConfig ref="paramConfig"
        :config="parameterDescription" 
        :defaultValue="values"
        :description="description"
        :tooltip="tooltip"
        @valueChanged="valueChanged" />
</template>
