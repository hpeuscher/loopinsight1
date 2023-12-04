<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType, toRaw } from 'vue'
import { defineAsyncComponent } from 'vue'
import { ModuleContents, ModuleImportList, ModuleProfileList } from '../../types/ModuleProfile.js'
import ControllerConfig from './ControllerConfig.vue'
import Patient, { PatientProfile } from '../../types/Patient.js'
import AccordionBox from './AccordionBox.vue'
import { VueI18n } from 'vue-i18n'

/** 
 * type describing contents of <i18n> block.
 * TODO: does probably not belong here, write unit test instead?
*/
declare type I18nLanguage = {
    locale: string,
    resource: {
        name: string
    }
}

/** list of controller components */
const controllerList = [
    "Oref0",
    "BasalBolus",
    "CSII",
    "MealBolus",
    "MealBolusWithCorrection",
    "PID",
]

// prepare dynamic module import
let controllerComponentImports: ModuleImportList = {}
let controllerComponents: ModuleProfileList = {}
for (const id of controllerList) {
    controllerComponentImports[id] = () => import(`./controllers/${id}.vue`)
    controllerComponents[id] = defineAsyncComponent(controllerComponentImports[id])
}

export default defineComponent({
    props: {
        patientProfile: Object as PropType<PatientProfile>
    },

    components: { 
        AccordionBox, 
        ControllerConfig,
        ...controllerComponents
    },

    emits: ["controllerChanged"],

    data() {
        return {
            controllerProfiles: {} as ModuleProfileList,
            selectedID: "Oref0",
        }
    },

    computed: {
        /**
         * if suitable Vue component exists, use that to configer the controller,
         * otherwise general configuration user interface
         */
        selectedComponent() {
            console.log("selected controller: "+this.selectedID)
            return this.controllerProfiles[this.selectedID]?.id ?? 
            (this.selectedID !== "" ? "ControllerConfig" : "")
        }, 

        selectedControllerID() {
            return this.controllerProfiles[this.selectedID]?.id ?? ""
        }, 

        selectedControllerVersion() {
            return this.controllerProfiles[this.selectedID]?.version ?? ""
        }, 

    },

    created() {
        for (const key of controllerList) {
            controllerComponentImports[key]()
            .catch( (result:any) => {
                console.warn("error importing controller component "+key+":")
                console.warn(result)
            })
            .then((controllerModule: ModuleContents | void) => {
                if (typeof controllerModule === "undefined") {
                    console.warn("error importing controller component "+key)
                    return
                }
                this.controllerProfiles[key] = controllerModule.profile
                // extract name entry from every locale of i18n
                const nameTranslations = controllerModule.default.__i18n?.reduce(
                    (x: Object, y: I18nLanguage) => 
                        ({ ...x, [y.locale]: { ["name." + key]: y.resource.name } }), {})
                // store these information into our translation resource
                for (const locale in nameTranslations) {
                    (<any>this.$i18n).mergeLocaleMessage(locale, nameTranslations[locale])
                }
            })
        }
    },

    methods: {
        getController() {
            const controllerConfig = <InstanceType<typeof ControllerConfig>>
                this.$refs.controllerConfig
            
            return controllerConfig.getController()
        },

        controllerChanged(newController: Object) {
            this.$emit("controllerChanged", toRaw(newController))
        },

    },
})
</script>


<template>
    <AccordionBox :title="$t('controllersettings')">
        <p>
            <label for="algorithm" class="labelpre">
                {{ $t("selectalgo") }}
            </label>
        </p>
        <p style="text-align:center;">
            <select id="algorithm" v-model="selectedID">
                <option v-for="controller in controllerProfiles" 
                    :key="controller.id" :value="controller.id">
                    {{ $t("name." + controller.id) }}
                </option>
            </select>
        </p>
        <component :is="selectedComponent" ref="controllerConfig" 
            :patientProfile="patientProfile" @controllerChanged="controllerChanged"
            :id="selectedControllerID" :version="selectedControllerVersion" 
        />
    </AccordionBox>
</template>


<i18n locale="en">
{
	"controllersettings": "Algorithm",
	"selectalgo": "Select algorithm / device / treatment",
}
</i18n>

<i18n locale="de">
{
	"controllersettings": "Algorithmus",
	"selectalgo": "Algorithmus / Gerät wählen",
}
</i18n>
