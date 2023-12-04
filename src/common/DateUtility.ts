/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

const MS_PER_MIN = 60e3

/**
 * Returns next regular update time (multiple of sampling time).
 * @param {Date} tNow - Current time
 * @param {number} tSampling - Sampling time in minutes (default: Infinity)
 * @returns {Date}
 */
export function nextUpdateTime(tNow: Date, tSampling: number = Infinity)
    : Date | undefined {
    
    if (!isFinite(tSampling)) {
        return undefined
    }

    return new Date(Math.floor(tNow.valueOf() / (tSampling * MS_PER_MIN) + 1)
        * (tSampling * MS_PER_MIN))
}

/**
 * Checks if given time is a multiple of sampling time.
 * @param {Date} tNow - Current time
 * @param {number} tSampling - Sampling time in minutes (default: Infinity)
 * @returns {boolean}
 */
export function isMultipleOfSamplingTime(tNow: Date, tSampling: number = Infinity)
    : boolean {
    return tNow.valueOf() % (tSampling * MS_PER_MIN) === 0
}


