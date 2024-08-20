/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import DailyProfile from '../common/DailyProfile.js'
import ParametricModule,
{
    EvaluatedParameterValues,
    ParameterDescriptions,
    ParameterValues,
    TypedParameterValues
} from "../types/ParametricModule.js"


export default abstract class AbstractParametricModule
    <Parameters extends ParameterDescriptions, 
    CommonParameters extends ParameterDescriptions = {}>
    implements ParametricModule {

    /** module parameter values according to description */
    private _parameters = {} as TypedParameterValues<Parameters, CommonParameters>

    constructor(parameters = {} as ParameterValues) {
        this.restoreDefaultParameterValues()
        this.setParameterValues(parameters)
    }

    /**
     * Returns the parameter description object containing units and defaults.
     * @returns {Parameters} parameter description
     */
    abstract getParameterDescription(): Parameters

    /**
     * Returns description of common parameters.
     * Override to provide parameters like sampling time which are used by
     * many/all modules.
     */
    getCommonParameterDescription(): CommonParameters {
        return {} as CommonParameters
    }

    getParameterDescriptionWithCommons(): Parameters & CommonParameters {
        return {
            ... this.getCommonParameterDescription(), 
            ... this.getParameterDescription()
        }
    }

    /**
    * Returns list of parameters (excluding common parameters).
    * @returns {Array<string>} List of parameters
    */
    getParameterList(): Array<string> {
        return Object.keys(this.getParameterDescription())
    }

    /** Returns translations. */
    getI18n() {
        return { i18n_label: {}, i18n_tooltip: {} }
    }

    /**
     * Returns unit of given parameter id
     * @param {keyof Parameters} id - parameter id
     */
    getParameterUnit(id: keyof TypedParameterValues<Parameters, CommonParameters>)
    : string | undefined {
        return this.getParameterDescriptionWithCommons()[id]?.unit
    }

    /**
     * modify some or all parameter values of this module
     * @param {ParameterValues} newValues - object with new parameter values
     * 
     * Note that the input argument "parameters" should actually be of type
     * TypedParameterValues<Parameters> which would only include valid keys
     * and suitable corresponding value types. But that would make calling the
     * function too restrictive, so the type ParameterValues was used instead.
     */
    setParameterValues(newValues: ParameterValues) {
        if (typeof newValues !== "object") {
            console.warn("parameter values must be of type object.")
            return
        }
        // only use parameters that are part of the list
        for (const paramName in newValues) {
            if (paramName in this._parameters) {
                const id: keyof TypedParameterValues<Parameters, CommonParameters> = paramName
                // TODO deeply merge objects (if applicable)
                if ((<any>newValues[paramName])?.type === "DailyProfile") {
                    // parameter contains daily profile, needs to be deserialized
                    // TODO avoid "any"
                    this._parameters[id] = <any>DailyProfile.fromJSON(<any>newValues[paramName])
                }
                else if (typeof newValues[paramName] === typeof this._parameters[id] || 
                    (typeof newValues[paramName] === "number" && this._parameters[id] instanceof DailyProfile) ||
                    (typeof this._parameters[id] === "number" && newValues[paramName] instanceof DailyProfile)
                ) {
                    // TODO: avoid "any"?
                    // We cannot know exactly what the parameter value is
                    // and if its structure really is valid.
                    this._parameters[id] = <any>newValues[paramName]
                }
                else {
                    console.warn(`value of parameter ${paramName} has wrong type.`)
                }
            }
            else {
                // console.warn(`ignoring unknown parameter ${paramName}.`)
            }
        }
    }

    /**
     * set all module parameter values to default
    */
    restoreDefaultParameterValues(): void {
        this._parameters = this.getDefaultParameterValues()
    }

    /**
     * return default parameter values of this module
     * @returns {ParameterValues} default parameter values
    */
    getDefaultParameterValues(): TypedParameterValues<Parameters, CommonParameters> {
        // extract defaults from parameter description
        return <TypedParameterValues<Parameters, CommonParameters>>
            getDefaultParameterValuesRecursive(this.getParameterDescriptionWithCommons())
    }

    /**
     * return set parameter values of this module
     * @returns {ParameterValues} parameter values
     */
    getParameterValues(): TypedParameterValues<Parameters, CommonParameters> {
        return this._parameters
    }

    /**
     * Evaluates parameter values of this module for given date
     * @param {Date} t - Date of interest.
     * @returns {ParameterValues} Parameter values at time t.
     */
    evaluateParameterValuesAt(t: Date): EvaluatedParameterValues<Parameters, CommonParameters> {
        let params = {} as ParameterValues
        for (const p in this._parameters) {
            if (this._parameters[p] instanceof DailyProfile) {
                params[p] = this._parameters[p].getAt(t)
            }
            else {
                params[p] = this._parameters[p]
            }
        }
        return <EvaluatedParameterValues<Parameters, CommonParameters>>params
    }

}


/**
* return default values of parameters from parameter description
* @param {ParameterDescriptions} config - description of parameters
* @returns {ParameterValues} object carrying default parameter values
*/
function getDefaultParameterValuesRecursive(config: ParameterDescriptions)
    : ParameterValues {
    if (typeof config === "undefined" || Object.keys(config).length === 0) {
        // configuration does not describe valid parameters
        return {}
    }
    return Object.fromEntries(
        Object.keys(config).map(function (p) {
            const defaultValue = config[p]?.default
            if (typeof defaultValue === "object" &&
                Object.values(defaultValue).filter( (entry) => typeof entry?.default !== "undefined" ).length > 0) {
                // parameter p is of type object, call this function recursively
                return [p, getDefaultParameterValuesRecursive(
                    <ParameterDescriptions>config[p].default)]
            }
            else if (defaultValue instanceof DailyProfile) {
                // clone default object
                return [p, DailyProfile.fromJSON(
                    JSON.parse(JSON.stringify(defaultValue)))]
            }
            else if (typeof defaultValue === "undefined") {
                return []
            }
            else if (typeof defaultValue === "number" && isNaN(defaultValue)) {
                return []
            }
            else {
                // parameter p is primitive
                return [p, config[p].default]
            }
        }).filter(
            (entry) => entry.length > 0
        )
    )
}


/**
 * Builder function to create module class from parameter description.
 * @param getParameterDescription - Function that returns an object of type 
 *      ParameterDescriptions which contains information on the available
 *      parameters.
 * @returns object implementing ParametricModule
 */
export const ParametricModuleBuilder = (getParameterDescription: Function) => {

    const myParameterDescription = getParameterDescription()

    class myModule extends AbstractParametricModule<typeof myParameterDescription, {}>
        implements ParametricModule {

        getParameterDescription() {
            return getParameterDescription()
        }
    }

    return new myModule()
}

