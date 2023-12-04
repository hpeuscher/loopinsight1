/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { ModuleProfile } from '../../types/ModuleProfile.js'
import Sensor, { Measurement, PatientOutput } from '../../types/Sensor.js'
import { TracedMeasurement } from '../../types/Signals.js'
import AbstractSensor from '../AbstractSensor.js'

export const profile: ModuleProfile = {
    type: "sensor",
    id: "IdealSMBG",
    version: "2.0.0",
    name: "Ideal SMBG",
}

/** Class representing ideally self-measured blood glucose. */
export default class IdealSMBG 
    extends AbstractSensor<{}> 
    implements Sensor {

    protected _lastGp!: number
    protected _smbg!: Measurement
    
    getModelInfo(): ModuleProfile {
        return profile
    }

    getInputList(): Array<keyof PatientOutput> {
        return ["Gp"]
    }

    getOutputList(): Array<keyof Measurement> {
        return ["SMBG"]
    }

    getParameterDescription() {
        return {}
    }

    reset(t: Date) {
        super.reset(t)
        this._lastGp = NaN
        this._smbg = {}
    }

    update(_t: Date, y: PatientOutput): Measurement {
        // remember current blood glucose
        this._lastGp = y.Gp

        // return placeholder by reference
        this._smbg = { SMBG: NaN }
        return this._smbg
    }

    override getOutput(): TracedMeasurement {
        const lastGp = this._lastGp
        const _this = this
        
        // return actual value
        return { SMBG: function() {
                // overwrite placeholder with actual value (for log)
                _this._smbg.SMBG = lastGp
                return lastGp
            }  
        }
    }

}
