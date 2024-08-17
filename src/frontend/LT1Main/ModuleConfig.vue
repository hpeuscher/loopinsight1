<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType, toRaw } from 'vue'
import { ModuleImport, ModuleImportList, ModuleContents, ModuleProfileList, ModuleTranslation, ModuleType } from '../../types/ModuleProfile.js'
import { ParameterFileContents } from '../../types/ParameterFileContents.js'
import ParameterConfig from './ParameterConfig.vue'
import DeviceSelection from './DeviceSelection.vue'
import ParametricModule, { ParameterValues } from '../../types/ParametricModule.js'

export default defineComponent({
    emits: ["valueChanged"],
    
    components: {
        DeviceSelection,
        ParameterConfig,
    },
    
    props: {
        type: {
            type: String as PropType<ModuleType>,
            required: true,
        },
        modelInfo: {
            type: Object as PropType<ModuleProfileList>,
            required: true,
        },
        defaultModel: String,
        modelImports: Object as PropType<ModuleImportList>,
    },

    data() {
        return {
            selectedModel: "",
            module: {} as ParametricModule,
            tooltip: {} as ModuleTranslation,
            description: {} as ModuleTranslation,
        }
    },



    computed: {
        modelList: function () {
            return Object.keys(this.modelInfo).sort((key1, key2) =>
                ('' + this.modelInfo[key1].name)
                    .localeCompare(this.modelInfo[key2].name))
        },

        parameterDescription: function() {
            return this.module?.getParameterDescription?.() ?? {}
        },

        /** 
         * return current parameter values.
         * This is used to transmit data top->down, e.g. when the patient
         * changes, the controller changes and its values must be transported
         * to the lower UI components.
         */
        values(): ParameterValues {
            return this.module?.getParameterValues?.() ?? {}
        },
    },

    mounted() {
        this.selectedModel = this.defaultModel || ""
        this.selectionChanged()
        // emit once after mount in case there are no parameters 
        // (otherwise emit should be initiated in <ParameterConfig>)
        this.$emit('valueChanged', this.getModule())
    },

    methods: {
        getModule(): ParametricModule {
            // return this.module
            return toRaw(this.module)
        },

        selectionChanged() {
            this.loadModel(this.selectedModel)
            // TODO: find a way to keep values that were changed manually
            // but take care of parameters that have the same name but
            // different unit
        },

        async loadFromFile(content: ParameterFileContents) {

            if (content?.type !== this.type) {
                console.warn("wrong file content")
                return
            }
            console.log("loading parameter file:")
            console.log(content)
            this.loadModel(content?.model, content?.parameters)
        },

        async loadModel(id: string, parameters: Object = {}) {
            console.log("load module "+id)
            const moduleImport = this.modelImports?.[id]
            if (typeof moduleImport === "undefined") {
                console.warn("Model \"" + id + "\" unknown.")
                return
            }
            this.selectedModel = id
            const moduleContents: ModuleContents = await moduleImport()

            this.module = <ParametricModule>new moduleContents.default(parameters)
            
            this.description = moduleContents.i18n_label?.[this.$i18n.locale] ??
                moduleContents.i18n_label?.en ?? moduleContents.html ?? {}

            this.tooltip = moduleContents.i18n_tooltip?.[this.$i18n.locale] ?? 
                moduleContents.i18n_tooltip?.en ??{}
            
            const paramConfig = <InstanceType<typeof ParameterConfig>>
                this.$refs.paramConfig
            paramConfig.setConfig(this.module.getParameterDescription())
            // this.module.restoreDefaultParameterValues()

            console.log("Loaded new " + moduleContents.profile.type + " " + id)
            this.$emit("valueChanged", this.getModule())
        },

        /** returns description of module including parameters */
        getParameterFile(): ParameterFileContents {
            return {
                type: this.type,
                model: this.modelInfo[this.selectedModel].id,
                version: this.modelInfo[this.selectedModel].version,
                created: new Date(Date.now()),
                description: "Created with LT1.org main simulator tool",
                parameters: this.module.getParameterValues()
            }
        },

        restoreDefaultValues() {
            if (typeof this.module?.restoreDefaultParameterValues !== "function") {
                return
            }
            this.module.restoreDefaultParameterValues()
            this.valueChanged({})
        },

        valueChanged(newParameterValues: ParameterValues) {
            if (typeof newParameterValues !== undefined) {
                // check if parameter values have actually changed
                const oldParams = JSON.stringify(this.module.getParameterValues?.())
                this.module.setParameterValues?.(newParameterValues)
                const newParams = JSON.stringify(this.module.getParameterValues?.())
                if (oldParams !== newParams) {
                    this.$emit("valueChanged", <ParametricModule>this.getModule())
                }
            }
        },

    },
})
</script>


<template>
    <div>
        <p>
            <label for="model" class="labelpre">{{ $t("selectmodel") }}:</label>
        </p>
        <p style="text-align:center;">
            <select id="model" v-model="selectedModel" @change="selectionChanged">
                <option v-for="key of modelList" :key="key" :value="key">
                    {{ modelInfo[key].name }}
                </option>
            </select>
            <span v-if="selectedModel" style="margin-left:5px;">
                <small>
                    <a :href="'https://lt1.org/models/' + selectedModel" 
                        v-tooltip="{ content: $t('online_info_tooltip') }"
                        target="_blank">
                        {{ $t("online_info") }}
                    </a>
                </small>
            </span>
        </p>
        <p style="text-align:center;">
            <input type="button" 
                :value="$t('restoreDefaultValues')" 
                @click="restoreDefaultValues" />
        </p>
        <ParameterConfig ref="paramConfig"
            :config="parameterDescription"
            :defaultValue="values"
            :tooltip="tooltip"
            :description="description"
            @valueChanged="valueChanged" />
    </div>
</template>


<i18n locale="en">
{
	"selectmodel"			: "Choose model",
	"selectdevice"			: "Load preconfigured device",
    "restoreDefaultValues"  : "restore default values",
	"online_info"			: "online info",
	"online_info_tooltip"	: "follow this link to learn more about the model.",
}
</i18n>

<i18n locale="de">
{
	"selectmodel"			: "Modell auswählen",
	"selectdevice"			: "Vorkonfiguriertes Gerät laden",
    "restoreDefaultValues"  : "Standardwerte wiederherstellen",
	"online_info"			: "Online-Info",
	"online_info_tooltip"	: "Unter diesem Link finden Sie Details zum Modell.",
}
</i18n>
