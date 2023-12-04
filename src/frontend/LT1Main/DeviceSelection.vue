<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { defineComponent, PropType } from 'vue'
import { ParameterFileContents, ParameterFileList } from '../../types/ParameterFileContents.js'

export default defineComponent({
    emits: ["valueChanged"],

    props: {
        deviceInfo: {
            type: Object as PropType<ParameterFileList>,
            required: true,
        },
    },

    data() {
        return {
            selectedDevice: "",
        }
    },

    computed: {
        deviceList: function () {
            return Object.keys(this.deviceInfo)
                .sort((key1, key2) => ('' + this.deviceInfo[key1].name)
                    .localeCompare('' + this.deviceInfo[key2].name))
        },
    },

    methods: {

        deviceChanged() {
            if (typeof this.deviceInfo[this.selectedDevice] === "undefined") {
                throw new Error("Device \"" + this.selectedDevice + "\" unknown.")
            }
            const device: ParameterFileContents = this.deviceInfo[this.selectedDevice]
            this.$emit("valueChanged", device)
            this.selectedDevice = ""
        },

    },
})
</script>


<template>
    <div style="text-align:center;">
        <label for="model" class="labelpre">{{ $t("selectdevice") }}:</label>
        <select id="model" v-model="selectedDevice" @change="deviceChanged">
            <option v-for="(device, key) in deviceInfo" :key="key" :value="key">
                {{ device.name }}
            </option>
        </select>
    </div>
</template>


<i18n locale="en">
{
	"selectdevice"			: "Load preconfigured device",
}
</i18n>

<i18n locale="de">
{
	"selectdevice"			: "Vorkonfiguriertes Gerät laden",
}
</i18n>
