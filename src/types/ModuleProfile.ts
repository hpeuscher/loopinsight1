/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import StructureDiagram from './StructureDiagram.js'

/** supported module types */
export type ModuleType = "controller" | "patient" | "actuator" | "sensor"

/** contents of a module */
export declare type ModuleContents = {
    /** class constructor */
    default: any
    /** profile with meta information */
    profile: ModuleProfile,
    /** html representation of signals/parameters */
    html?: ModuleTranslation,
    /** short description of signals/parameters */
    i18n_label?: ModuleTranslationList,
    /** more extensive information on signals/parameters for tooltip */
    i18n_tooltip?: ModuleTranslationList,
    /** graphical representation */
    diagram?: StructureDiagram
}

/** every module requires a profile containing meta information */
export declare type ModuleProfile = {
    /** module type */
    type: ModuleType
    /** unique id */
    id: string
    /** version */
    version: string
    /** written name of the module (to display) */
    name: string
    /** basis of the module (if applicable) */
    extends?: string
    /** short description */
    description?: string
}


/** a named list of module profiles */
export declare type ModuleProfileList = {
    [id in string]: ModuleProfile
}

/** a named list of module translations */
export type ModuleTranslationList = {
    [locale in string]: ModuleTranslation
}

/** module translation for a single locale */
export type ModuleTranslation = {
    [id in string]: string | ModuleTranslation
}

/** 
 * result of a dynamic call to import() 
 * (for lazy loading of modules)
 */
export type ModuleImport = () => Promise<ModuleContents>

/** list of module imports */
export type ModuleImportList = {
    [id in string]: ModuleImport
}

