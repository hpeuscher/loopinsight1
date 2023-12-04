<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import Patient from '../../types/Patient.js'
import { ModuleImportList, ModuleProfileList } from '../../types/ModuleProfile.js'
import { ParameterFileContents } from '../../types/ParameterFileContents.js'
import AccordionBox from './AccordionBox.vue'
import ModuleConfig from './ModuleConfig.vue'

/** list of physiological models, provided by bundler */
declare var __LT1_LOCAL_MODELS__: ModuleProfileList

export default defineComponent({
    emits: ["patientChanged"],

    components: {
        AccordionBox,
        ModuleConfig
    },

    data() {
        return {
            modelImports: {} as ModuleImportList,
        }
    },

    computed: {
        modelInfo: function() {return __LT1_LOCAL_MODELS__},
    },

    created() {
        // import module dynamically
        for (const id in this.modelInfo) {
            this.modelImports[id] = () => import(
                /* webpackChunkName: "models_[request]" */
                /* webpackMode: "lazy" */
                `../../core/models/${id}.ts`
            )
        }
    },

    methods: {

        getPatient(): Patient {
            const moduleConfig = <InstanceType<typeof ModuleConfig>>
                this.$refs.moduleConfig
            return <Patient>moduleConfig.getModule()
        },

        loadFile(filename: Blob) {
            return new Promise( (resolve) => {
                const reader = new FileReader()
                reader.addEventListener('load', (event) => {
                    if (!event.isTrusted) {
                        console.warn("file not trusted")
                        return
                    }
                    if (typeof event.target?.result === "undefined") {
                        console.warn("error reading file")
                        return
                    }
                    const result = <string>event.target.result
                    const content = JSON.parse(decodeURIComponent(result))
                    resolve(content)
                })
                reader.readAsText(filename)
            })
        },

        /** import model from uploaded JSON file */
        async loadPatient(event: Event) {
            if (typeof event?.target === "undefined") {
                return
            }
            const target = event.target as HTMLInputElement
            if (!Array.isArray(target.files)) {
                return
            }
            const file = target.files[0]
            const content = <ParameterFileContents>await this.loadFile(file)

            const moduleConfig = <InstanceType<typeof ModuleConfig>>
                this.$refs.moduleConfig
            moduleConfig.loadFromFile(content)

        },

        /** save virtual patient as JSON file */
        savePatient() {
            const moduleConfig = <InstanceType<typeof ModuleConfig>>
                this.$refs.moduleConfig
            const content = moduleConfig.getParameterFile()
            
            const now = new Date(Date.now())
            const nowString = now.toISOString().split(".")[0].replaceAll("-", "")
                .replaceAll("T", "_").replaceAll(":", "").replaceAll(".", "")
            const filename = 'LT1_Patient_' + content.model + '_' + nowString + '.json'
            
            const encodedContent = 'data:text/plain;charset=utf-8,'
                + encodeURIComponent(JSON.stringify(content))
            const element = document.getElementById('savepatientdownload')!
            element.setAttribute('href', encodedContent)
            element.setAttribute('download', filename)
            element.click()
        },

        valueChanged(newPatient: Patient) {
            this.$emit('patientChanged', newPatient)
        }
    },
})
</script>


<template>
    <AccordionBox :title="$t('patientsettings')">
        <p style="text-align:center;">
            <input type="button" style="margin-right:1em;" 
                :value="$t('savepatient')" @click="savePatient">
            <a id="savepatientdownload" style="display:none" />
            <input id="fileInput" type="file" style="display:none;" 
                accept=".json" @change="loadPatient" />
            <input type="button" :value="$t('loadpatient')" 
                onclick="document.getElementById('fileInput').click();" />
        </p>
        <ModuleConfig ref="moduleConfig"
            :type="'patient'"
            :modelInfo="modelInfo"
            :modelImports="modelImports"
            :defaultModel="'UvaPadova'"
            @valueChanged="valueChanged"
        />
    </AccordionBox>
</template>

<i18n locale="en">
{
	"model"				: "Choose physiological model",
	"patientsettings"	: "Virtual Patient",
	"savepatient"		: "save patient",
	"loadpatient"		: "load patient",
}
</i18n>

<i18n locale="de">
{
	"model"				: "Physiologisches Modell auswählen",
	"patientsettings"	: "Virtuelle Patient:in",
	"savepatient"		: "Patient:in speichern",
	"loadpatient"		: "Patient:in laden",
}
</i18n>
