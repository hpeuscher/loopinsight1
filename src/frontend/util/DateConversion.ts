/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

const MS_PER_MIN = 60e3

/**
 * transforms Date to browser locale String
 * @param {Date} date 
 * @returns {string} formatted date
 */
function dateToBrowserLocale(date: Date): string {
    const t: number = date.valueOf() - date.getTimezoneOffset() * MS_PER_MIN
    return new Date(t).toISOString().substring(0, 19)
}

export { dateToBrowserLocale }

