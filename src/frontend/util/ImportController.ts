/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { ModuleContents } from '../../types/ModuleProfile.js'

/**
 * utlitity function to import backend controller with standardized 
 * webpack magic comments and version control
 * @param {string} id - id of controller module
 * @param {string} version
 */
export default async function (id: string, version?: string)
    : Promise<ModuleContents | undefined> {
    // TODO: select "latest" version as default
    const filename = id // + "_" + version

    try {
        const controllerModule = await import(
            /* webpackChunkName: "controllers_[request]" */
            /* webpackMode: "lazy" */
            `../../core/controllers/${filename}`
        )
        return <ModuleContents>controllerModule
    }
    catch (e) {
        console.warn(e)
        return undefined
    }

}
