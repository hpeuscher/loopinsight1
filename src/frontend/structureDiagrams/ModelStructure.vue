<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent } from 'vue'
import SVGChart from './SVGChart.vue'
import { ModuleContents, ModuleImportList } from '../../types/ModuleProfile.js'
import StructureDiagram, { Translation } from '../../types/StructureDiagram.js'

declare var __LT1_LOCAL_MODELS__: ModuleImportList

export default defineComponent({
    props: {
        selectedModel: String,  // accept model selection 
    },

    components: {
        SVGChart
    },

    data() {
        return {
            model: this.selectedModel || '',
            modelInfo: __LT1_LOCAL_MODELS__,	// provided by webpack define plugin
            modelImports: {} as ModuleImportList,
            diagram: {} as StructureDiagram,
        }
    },

    computed: {
        modelList: function () { return Object.keys(this.modelInfo) },
    },

    watch: {
        "selectedModel"() {
            this.selectionChanged()
        },
    },

    beforeMount() {
        // prepare dynamic module import
        for (const key of this.modelList) {
            this.modelImports[key] = () => import(
                /* webpackChunkName: "models_[request]" */
                /* webpackMode: "lazy" */
                `../../core/models/${key}`
            )
        }
    },


    methods: {

        selectionChanged() {
            // check if valid model is selected
            if (this.model.length === 0) {
                if (this.selectedModel?.length === 0) {
                    return
                }
                this.model = this.selectedModel!
            }
            if (this.modelList.indexOf(this.model) < 0) {
                console.log("unknown model \"" + this.model + "\"")
                return
            }
            console.log("selected model: \"" + this.model + "\"")

            const modelModule = this.modelImports[this.model]()
            modelModule.then((model: ModuleContents) => {
                const tooltip = model.i18n_label?.[this.$i18n.locale] ??
                    model.i18n_tooltip?.[this.$i18n.locale] ?? {}
                const tooltipStrings = Object.fromEntries(Object.keys(tooltip).map((id) =>
                    [id, JSON.stringify(tooltip[id])]
                ))
                const htmlStrings = Object.fromEntries(Object.keys(model.html || {}).map((id) =>
                    [id, JSON.stringify(model.html?.[id])]
                ))
                
                this.diagram = { ...<StructureDiagram>model.diagram, htmlStrings, tooltipStrings }
            })
        },
    }
})
</script>

<template>
    <div>
        <p v-show="model == ''">
            Select model:
            <select v-model="model" @change="selectionChanged">
                <option v-for="m in modelList" :value="m" :key="m">{{ m }}</option>
            </select>
        </p>
        <SVGChart :diagram="diagram" />
    </div>
</template>
