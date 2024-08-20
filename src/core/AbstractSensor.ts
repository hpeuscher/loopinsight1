/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { nextUpdateTime } from '../common/DateUtility.js'
import { ModuleProfile } from '../types/ModuleProfile.js'
import { ParameterDescriptions } from '../types/ParametricModule.js'
import Sensor, {
    Measurement, PatientOutput
} from '../types/Sensor.js'
import { TracedMeasurement } from '../types/Signals.js'
import Solver from '../types/Solver.js'
import AbstractParametricModule from './AbstractParametricModule.js'

/**
 * Abstract class suited to implement a sensor module
 * @extends AbstractParametricModule
 * @implements {Sensor}
 */
export default abstract class AbstractSensor
    <Parameters extends ParameterDescriptions>
    extends AbstractParametricModule
    <Parameters, typeof CommonSensorParametersDescription>
    implements Sensor {

    /** previous output */
    protected output: Measurement = {}

    /**
     * Provides description of common parameters.
     */
    override getCommonParameterDescription() {
        return CommonSensorParametersDescription
    }

    /**
     * Returns information about the model.
     * @returns {ModuleProfile} Profile.
     */
    abstract getModelInfo(): ModuleProfile

    /**
     * Returns list of inputs used by this sensor.
     * @returns {Array<keyof PatientOutput>} List of inputs.
     */
    abstract getInputList(): Array<keyof PatientOutput>

    /**
     * Returns list of measurements provided by this sensor.
     * @returns {Array<keyof Measurement>} List of outputs.
     */
    abstract getOutputList(): Array<keyof Measurement>

    /**
     * Computes measurements delivered by sensor (to be logged).
     * @param {Date} t - Current time
     * @param {PatientOutput} y - Physiological outputs from patient
     * @returns {Measurement} Measurement provided by this sensor
     */
    abstract update(t: Date, y: PatientOutput): Measurement


    reset(_t: Date, _seed?: number, _solver?: Solver): void {
        this.output = {}
    }

    /**
     * Returns measurement as functions of time (to be passed on to controller).
     * Override this method to provide special functionality, e.g. SMBG data
     * which is only generated when requested by the controller.
     * @returns {Measurement}
     */
    getOutput(): TracedMeasurement {
        return Object.fromEntries(this.getOutputList().map(
            (id: string) => [id, () => this.output[<keyof Measurement>id]]
        ))
    }

    /**
     * Returns next required update time.
     * @returns { Date | undefined }
     */
    getNextUpdateTime(t: Date): Date | undefined {
        return nextUpdateTime(t, this.evaluateParameterValuesAt(t).samplingTime)
    }
}


/** 
 * Description of parameters which are commonly used by sensor models.
 * 
 * These values are available implicitly in each child of the abstract class,
 * but they are not listed in getParameterList except if you explicitly include
 * them into the parameterDescription. If you do that, you can overwrite the
 * default value, but please note that you may not change the unit. 
 */
export const CommonSensorParametersDescription = {
    /** sampling time in minutes */
    samplingTime: { unit: "min", default: Infinity },
    /** smallest possible measurement value in mg/dl */
    min: { unit: "mg/dl", default: 0 },
    /** largest possible measurement value in mg/dl */
    max: { unit: "mg/dl", default: 1000 },
    /** resolution in mg/dl */
    resolution: { unit: "mg/dl", default: 0 },
}
