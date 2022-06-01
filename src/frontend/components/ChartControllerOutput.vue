<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
   	See https://lt1.org for further information.	*/

import moment from "../../../node_modules/moment/moment.js"

export default {
	data() {
		return {
			boxactive: true,
			controllerOutput: {},
			t0: "",
		};
	},
	methods: {
		setSimulationResults(simResults) {
			this.reset()
			for (const result of simResults) {
				const {t, x, u, y, logData} = result
				this._pushRecord(t, x, u, y, logData)
			}
			this._update
		},	
		reset() {
			this.controllerOutput = {};
			this.t0 = "";
		},
		_pushRecord(_t, _x, _u, _y, _log)  {
		},	
		_update(){
		},		
		controllerDataHover(t0, data) {
			this.t0 = moment(t0).format(this.$t("dateformat"));
			this.controllerOutput = data;
		},
	},
	computed: {
		reason() {
			if (typeof this.controllerOutput !== "undefined") {
				return this.controllerOutput.reason;
			}
			return {};
		},
		debug() {
			if (typeof this.controllerOutput !== "undefined") {
				return this.controllerOutput.debug;
			}
			return {};
		},
	}
}
</script>


<template>
	<div class="box2 accordionbox" v-bind:class="{boxactive: boxactive}">
		<h3 @click="[boxactive=!boxactive]">{{$t("title")}}</h3>
		<div id="controllerOutput">
			<h4>{{$t("time")}}: {{t0}}</h4>
			<h4 v-if="reason">Reason</h4>
			<div id="controllerReason">
				<p v-for="r in reason" :key="r">{{r}}</p>
			</div>
			<h4 v-if="debug">Debug</h4>
			<div id="controllerDebug">
				<p v-for="r in debug" :key="r">{{r}}</p>
			</div>
		</div>
	</div>
</template>


<style lang="css" scoped>
#controllerOutput {
	font-size: 0.85rem;
	font-family: Courier;
	margin: 1rem;
	padding: 0.5rem; 
	border: solid 1px;
	background-color: #eeeeee;
}
p {
	margin-top: 0;
	margin-bottom: 0;
	margin-left: 1rem;
}
</style>


}

<i18n locale="en">
{
	"title":	"Algorithm outputs and logs",
	"time":		"time",
	"dateformat":	"Do MMMM YYYY hh:mm:ss",
}
</i18n>
<i18n locale="de">
{
	"title": 	"Algorithmus-Ausgaben und -Logs",
	"time":		"Zeitpunkt",
	"dateformat":	"DD.MM.YYYY hh:mm:ss",
}
</i18n>
