/* This file is part of LoopInsighT1, an open source tool to
   simulate closed-loop glycemic control in type 1 diabetes.
   Distributed under the MIT software license.
   See https://lt1.org for further information.	*/

// prepare Vue app
import * as Vue from 'vue';
import MinimalGui from './components/MinimalGui.vue';

const LT1VueApp = {
	template: '<MinimalGui/>',
	components: {
		MinimalGui,
	},
};


// create
const app = Vue.createApp(LT1VueApp);


// add multi-language support
import { createI18n } from "vue-i18n";

const i18n = createI18n({
	locale: (document.getElementsByTagName("html")[0].lang || navigator.language.split('-')[0]).substring(0,2),
	fallbackLocale: 'en',
});
app.use(i18n);


// add tooltip support
import VTooltip from 'v-tooltip';
import 'v-tooltip/dist/v-tooltip.css';
app.use(VTooltip);


// mount
const gui = app.mount('#app_minimal_gui');
