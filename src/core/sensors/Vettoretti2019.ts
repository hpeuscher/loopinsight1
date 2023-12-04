/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/*
The CGM sensor model implemented in this file uses information from:

[Vettoretti 2019]
    Vettoretti, M.; Del Favero, S.; Sparacino, G.; Facchinetti, A.
    "Modeling the error of factory-calibrated continuous glucose 
     monitoring sensors: application to Dexcom G6 sensor data"
    41st Annual International Conference of the IEEE EMBC, 2019
    DOI: 10.1109/embc.2019.8856790


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
    id: "Vettoretti2019",
    extends: "Facchinetti2014",
    version: "2.0.0",
    name: "Dexcom G6 (Vettoretti 2019)",
    description: "Dexcom G6"
}

/** Class representing a Dexcom G6 CGM sensor as described by Vettoretti. */
export default class CGM_Vettoretti2019 
    extends CGMSensor_Facchinetti2014 
    implements Sensor {
    
    override getModelInfo(): ModuleProfile {
        return profile
    }
    
    override getDefaultParameterValues() {
        // override defaults
        return {
            ... super.getDefaultParameterValues(),

            alpha_w1: 1.220,        // Table 2 ("sensor specific", alpha1)
            alpha_w2: -0.331,       // Table 2 ("sensor specific", alpha2)
            sigma_2_w: 3.641,       // Table 2 ("sensor specific", lambda^2)

            alpha_cc1: 1.34,        // Table 2 ("common component", beta1)
            alpha_cc2: -0.492,      // Table 2 ("common component", beta2)
            sigma_2_cc: 5.538,      // Table 2 ("common component", sigma^2)

            a0: 1.048,              // Table 1
            a1: -0.033,             // Table 1
            a2: 0.002,              // Table 1
            b0: -6.398,             // Table 1
            b1: 6.179,              // Table 1
            b2: -0.448,             // Table 1
            
            samplingTime: 5,
        }
    }
}

export { html, i18n_label, i18n_tooltip } from './Facchinetti2014.js'
