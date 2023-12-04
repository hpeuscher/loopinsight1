/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { SimulationResult } from '../../types/SimulationResult.js'

export default class InvalidResultError extends Error {

    constructor(t: Date, result: Partial<SimulationResult>) {
        const resultString = JSON.stringify(result)
        const message = `Invalid simulation result at time ${t?.toLocaleString?.()}: ${resultString}.`
        super(message)
    }

}
