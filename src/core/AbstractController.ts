/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { nextUpdateTime } from '../common/DateUtility.js'
import Controller, {
    AnnouncementList,
    ControllerInternals, ControllerOutput,
    Measurement, TracedMeasurement
} from '../types/Controller.js'
import { ModuleProfile } from '../types/ModuleProfile.js'
import { ParameterDescriptions } from '../types/ParametricModule.js'
import Solver from '../types/Solver.js'
import AbstractParametricModule from './AbstractParametricModule.js'

/**
 * Abstract class suited to implement a controller module
 * @extends AbstractParametricModule
 * @implements {Controller}
 */
export default abstract class AbstractController
    <Parameters extends ParameterDescriptions>
    extends AbstractParametricModule
    <Parameters, typeof CommonControllerParametersDescription>
    implements Controller {

    /** actual output of this module */
    protected output: ControllerOutput = {}
    /** internal log messages, computations, predictions, etc. */
    protected internals: ControllerInternals = {}

    /**
     * Provides description of common parameters.
     */
    override getCommonParameterDescription() {
        return CommonControllerParametersDescription
    }

    /**
     * Returns information about the model.
     * @returns {ModuleProfile} Profile.
     */
    abstract getModelInfo(): ModuleProfile

    /**
     * Returns list of inputs used by this module
     * @returns {Array<keyof Measurement>} list of inputs
     */
    abstract getInputList(): Array<keyof Measurement>

    /**
     * Returns list of outputs provided by this module
     * @returns {Array<keyof ControllerOutput>} list of outputs
     */
    abstract getOutputList(): Array<keyof ControllerOutput>

    /**
    * Computes required medication.
    * @param {Date} t - Current time.
    * @param {TracedMeasurement} s - Sensor data.
    * @param {AnnouncementList} a - Meal announcements.
    * @param {ControllerOutput} m - Output from parallel controllers called earlier.
    */
    abstract update(
        t: Date,
        s: TracedMeasurement,
        a?: AnnouncementList,
        m?: ControllerOutput
    ): void

    reset(_t: Date, _seed?: number, _solver?: Solver): void {
        this.output = {}
        this.internals = {}
    }

    /**
     * Returns currently required medication.
     * @returns {ControllerOutput}
     */
    getOutput(): ControllerOutput {
        return this.output
    }

    /**
    * Returns current internal log messages, computations, predictions, etc.
    * @returns {ControllerInternals}
    */
    getInternals(): ControllerInternals {
        return this.internals
    }


    /**
     * Returns next required update time.
     * @returns {Date | undefined}
     */
    getNextUpdateTime(t: Date): Date | undefined {
        return nextUpdateTime(t, this.evaluateParameterValuesAt(t).samplingTime)
    }

}

/** 
 * Description of parameters which are commonly used by controllers.
 * 
 * These values are available implicitly in each child of the abstract class,
 * but they are not listed in getParameterList except if you explicitly include
 * them into the parameterDescription. If you do that, you can overwrite the
 * default value, but please note that you may not change the unit. 
 */
export const CommonControllerParametersDescription = {
    /** sampling time in minutes */
    samplingTime: { unit: "min", default: Infinity },
    /** target blood glucose in mg/dl */
    targetBG: { unit: 'mg/dl', default: NaN },
    /** default basal rate in U/h */
    basalRate: { unit: 'U/h', default: NaN },
}
