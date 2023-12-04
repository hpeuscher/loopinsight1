/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { ModuleTranslationList } from './ModuleProfile.js'

/**
 * Interface describing a module that uses parameters.
 */
export default interface ParametricModule {

    /**
    * Returns list of parameter ids.
    * @returns {Array<string>} List of parameter ids.
    */
    getParameterList(): Array<string>

    /** Returns translations. */
    getI18n(): {i18n_label: ModuleTranslationList, i18n_tooltip: ModuleTranslationList}

    /**
     * Returns the parameter description object containing units, defaults, ...
     * @returns {ParameterDescriptions} Parameter description object.
     */
    getParameterDescription(): ParameterDescriptions

    /**
     * Returns all default parameter values of this module.
     * @returns {ParameterValues} Default parameters.
    */
    getDefaultParameterValues(): ParameterValues

    /**
     * Returns unit of given parameter id.
     * @param {keyof Parameters} id - Parameter id.
     * @returns {string} Unit.
     */
    getParameterUnit(id: string): string | undefined

    /**
     * Returns module parameters.
     * @returns {ParameterValues}
     */
    getParameterValues(): ParameterValues

    /**
     * Overwrites module parameters values with given values.
     * @param {ParameterValues} parameters - New parameter values.
     */
    setParameterValues(parameters: ParameterValues): void

    /**
     * Sets all module parameter values to default.
     */
    restoreDefaultParameterValues(): void
}


/** supported types of a parameter value */
export declare type ParameterValue = number | object | boolean | string

/** general module configuration (not specific to a certain module) */
export declare type ParameterValues = {
    [id in string]: ParameterValue
}

/** description of single parameter */
export declare type ParameterDescription = {
    default: ParameterValue | ParameterDescriptions
    unit?: string
    min?: number
    max?: number
    increment?: number
}

/** set of parameter descriptions to describe a module */
export declare type ParameterDescriptions = {
    [id in string]: ParameterDescription
}


/** 
 * generic module configuration, i.e. object of parameter values.
 * The type of each parameter is inferred from its respective default value.
 */
export declare type TypedParameterValues<Parameters extends ParameterDescriptions,
    CommonParameters extends ParameterDescriptions> = {
    [id in keyof Parameters]: 
        // if instead of a default value we have another configuration...
        Parameters[id]["default"] extends ParameterDescriptions
    ?
    {
        // ... this parameter is an object -> find out types of its entries
        [key in keyof Parameters[id]["default"]]: 
            Parameters[id]["default"][key]["default"] 
    }
    :
    // otherwise, this parameter is scalar -> use type of its default value
    Parameters[id]["default"]
} & 
{
    [id in keyof CommonParameters]: 
        // if instead of a default value we have another configuration...
        CommonParameters[id]["default"]
}
