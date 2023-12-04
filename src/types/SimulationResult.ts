/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { ControllerInternals } from './Controller.js'
import { PatientState } from './Patient.js'
import {
    AnnouncementList,
    ControllerOutput,
    Measurement,
    PatientInput,
    PatientOutput
} from './Signals.js'

export type SimulationResult = {
    t: Date,
    x: PatientState,
    u: PatientInput,
    y: PatientOutput,
    s: Measurement,
    c: ControllerOutput,
    a: AnnouncementList,
    log?: ControllerInternals,
}
