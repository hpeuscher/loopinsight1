/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/*
The CGM sensor model implemented in this file uses information from:

[Vettoretti 2018]
    Vettoretti, M.; Facchinetti, A.; Sparacino, G.; Cobelli, C.:
    "Type-1 Diabetes Patient Decision Simulator for In Silico Testing Safety 
     and Effectiveness of Insulin Treatments"
    IEEE Transactions on Biomedical Engineering, Volume 65, No. 6, 2018
    DOI: 10.1109/tbme.2017.2746340


[Facchinetti 2014]
    Facchinetti, A.; Del Favero, S.; Sparacino, G.; Castle, J.R.; Ward, W.K.; Cobelli, C.:
    "Modeling the Glucose Sensor Error"
    IEEE Transactions on Biomedical Engineering, Volume 61, No. 3, 2014
    DOI: 10.1109/TBME.2013.2284023

*/


import { ModuleProfile } from '../../types/ModuleProfile.js'
import Sensor from '../../types/Sensor.js'
import CGMSensor_Facchinetti2014 from './Facchinetti2014.js'

export const profile: ModuleProfile = {
    type: "sensor",
    id: "Vettoretti2018",
    extends: "Facchinetti2014",
    version: "2.0.0",
    name: "Dexcom G5 (Vettoretti 2018)",
    description: "Dexcom G5"
}

/** Class representing a Dexcom G5 CGM sensor as described by Vettoretti. */
export default class CGM_Vettoretti2018
    extends CGMSensor_Facchinetti2014
    implements Sensor {

    override getModelInfo(): ModuleProfile {
        return profile
    }

    override getDefaultParameterValues() {
        // override defaults
        return {
            ... super.getDefaultParameterValues(),

            alpha_w1: 1.27,         // Table 1 ("sensor specific", c1)
            alpha_w2: -0.42,        // Table 1 ("sensor specific", c2)
            sigma_2_w: 7.64,        // Table 2 ("sensor specific", sigma_in^2)

            alpha_cc1: 0,           // "common component" not present
            alpha_cc2: 0,           // "common component" not present
            sigma_2_cc: 0,          // "common component" not present

            a0: 1.04,               // Table 1
            a1: 0.02,               // Table 1
            a2: 0,                  // Table 1
            b0: -8.75,              // Table 1
            b1: 0,                  // Table 1
            b2: 0,                  // Table 1

            samplingTime: 5,
        }
    }
}

export { html, i18n_label, i18n_tooltip } from './Facchinetti2014.js'
