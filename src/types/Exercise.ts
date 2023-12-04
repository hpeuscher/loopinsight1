/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/**
 * An exercise unit.
 */
declare type Exercise = {
    /** Time the exercise unit starts */
    start: Date
    /** Duration of exercise unit in minutes */
    duration: number
    /** Intensity of exercise unit in % */
    intensity: number
}

export default Exercise
