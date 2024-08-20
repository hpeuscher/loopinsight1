/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { isMultipleOfSamplingTime } from '../../common/DateUtility.js'
import { ModuleProfile } from '../../types/ModuleProfile.js'
import Sensor, { Measurement, PatientOutput } from '../../types/Sensor.js'
import AbstractSensor from '../AbstractSensor.js'

export const profile: ModuleProfile = {
    type: "sensor",
    id: "IdealCGM",
    version: "2.1.0",
    name: "Ideal CGM sensor",
}

/** Class representing an ideal CGM sensor */
export default class CGMSensor 
    extends AbstractSensor<typeof IdealCGMParameters> 
    implements Sensor {
    
    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array<keyof PatientOutput> {
        return ["Gp"]
    }

    getOutputList(): Array<keyof Measurement> {
        return ["CGM"]
    }

    getParameterDescription() {
        return IdealCGMParameters
    }

    update(t: Date, y: PatientOutput) {
        const params = this.evaluateParameterValuesAt(t)
        // sampling
        if (isMultipleOfSamplingTime(t, params.samplingTime)) {
            this.output = { CGM: y.Gp }
            return { CGM: y.Gp }
        }
        return {}
    }

}


export const IdealCGMParameters = {
    /** sampling time in minutes */
    samplingTime: { unit: "min", default: 5 },
}


export const i18n_label = {
    en: {
        samplingTime: "Sampling time",
    },
    de: {
        samplingTime: "Abtastzeit",
    },
}
