/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { limit } from './UtilityFunctions.js'

/**
 * Interpolation method: ZEROORDER, LINEAR, SQUARE
 */
export enum InterpolationMethod {
    ZEROORDER,
    LINEAR,
    SMOOTHSTEP
}

/**
 * Time of day (hours passed since midnight)
 */
export type TimeOfDay = number
/**
 * Node point of profile
 */
export type ProfileNode = [TimeOfDay, number]
/**
 * Profile information (e.g., within JSON file)
 */
export type Profile = {
    nodes: Array<ProfileNode>
    method?: InterpolationMethod
    stepDuration?: number
} 

/**
 * Returns time of day of given date.
 * @param {Date} date - Time of interest.
 * @returns {number} Hours passed since midnight.
 */
export function getTODfromDate(date: Date): number {
    return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600
}

/**
 * Class to generate a daily profile by interpolation an array of nodes
 * following a given method/strategy.
 */
export default class DailyProfile {
    /** Interpolation method */
    method: InterpolationMethod
    /** Node elements, each describing time of day and value */
    nodes: Array<[number, number]>
    /** duration of steps / transitions in hours */
    stepDuration: number

    /**
     * Creates an interpolation object.
     * @param {ProfileNode[]} nodes - Nodes of time and value.
     * @param {InterpolationMethod} method - Nodes of time and value.
     * @param {number} stepDuration - Duration of steps / transitions in hours.
     */
    constructor(
        nodes: Array<ProfileNode>,
        method: InterpolationMethod = InterpolationMethod.ZEROORDER,
        stepDuration: number = 1,
        private type = "DailyProfile"
    ) {
        // check if data is valid
        if (typeof nodes === "undefined" || nodes?.length < 1 || nodes[0][0] !== 0) {
            throw new Error("Invalid daily profile data")
        }

        this.nodes = nodes
        this.method = method
        this.stepDuration = stepDuration
    }

    /**
     * Performs zero-order interpolation for time of interest.
     * @param {Date} tod - Time of day.
     * @returns {number} Interpolation result.
     */
    _interp0(tod: number): number {
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            if (this.nodes[i][0] <= tod) {
                return this.nodes[i][1]
            }
        }
        // this should not happen
        return NaN
    }

    /**
     * Performs first-order interpolation for time of interest.
     * @param {Date} tod - Time of day.
     * @returns {number} Interpolation result.
     */
    _interp1(tod: number): number {
        const N = this.nodes.length

        // check if profile contains at least one node
        if (N === 0)
            return NaN

        // if tod is less than first time, return NaN (should not happen)
        if (tod < this.nodes[0][0])
            return NaN

        // find actual node (last node before now)
        for (let k = N - 1; k >= 0; k--) {
            if (tod >= this.nodes[k][0]) {
                // interpolate
                const x0 = this.nodes[k][0]
                const y0 = this.nodes[k][1]
                const x1 = k < N - 1 ? this.nodes[k + 1][0] : 24
                const y1 = k < N - 1 ? this.nodes[k + 1][1] : this.nodes[0][1]
                return y0 + (y1 - y0) / (x1 - x0) * (tod - x0)
            }
        }

        // this should not happen
        return NaN

    }


    /**
     * Performs smooth-step interpolation for time of interest.
     * @param {number} tod - Time of day.
     * @returns {number} Interpolation result.
     */
    _interp_smooth(tod: number): number {

        const N = this.nodes.length
        // for less than three points perform linear interpolation
        if (this.nodes.length < 2) {
            return this._interp1(tod)
        }

        // shift whole curve such that nodes are in the middle of transitions
        tod = (tod + this.stepDuration / 2) % 24

        // find actual node (last node before now)
        let k = 0
        for (let i = N - 1; i >= 0; i--) {
            if (tod >= this.nodes[i][0]) {
                k = i
                break
            }
        }

        // has the transition been completed?
        if (tod >= this.nodes[k][0] + this.stepDuration) {
            // yes, return node value
            return this.nodes[k][1]
        }

        // otherwise, we are within a transition
        /** index of previous node */
        const p = k > 0 ? k - 1 : N - 1
        /** normalized time within transition (between 0 and 1) */
        const t_ = (tod - this.nodes[k][0]) / this.stepDuration % 1

        // compute and return smoothstep polynomial
        return this.nodes[p][1] + (this.nodes[k][1] - this.nodes[p][1]) *
            Math.pow(t_, 3) * (10 - 15 * t_ + 6 * Math.pow(t_, 2))

    }

    /**
     * Evaluate daily profile at given date.
     * @param {Date} t - Time of interest.
     * @returns {number} Interpolated value at time of interest.
     */
    getAt(t: Date): number {
        if (t instanceof Date) {
            return this.getAtTOD(getTODfromDate(t))
        }
        else {
            // if time is unknown, assume midnight
            return this.getAtTOD(0)
        }
    }

    /**
     * Evaluate daily profile at given time of day.
     * @param {number} tod - time of day in hours since midnight.
     * @returns {number} Interpolated value at time of interest.
     */
    getAtTOD(tod: number): number {
        switch (this.method) {
            case InterpolationMethod.ZEROORDER:
                return this._interp0(tod)
            case InterpolationMethod.LINEAR:
                return this._interp1(tod)
            case InterpolationMethod.SMOOTHSTEP:
                return this._interp_smooth(tod)
        }
    }

    /**
     * Inserts node at given coordinates. If there is another node within
     * a distance of stepDuration, it is moved to the given position instead.
     * @param {ProfileNode} newNode - New Node.
     */
    insertNode(newNode: ProfileNode): void {
        // limit between zero and midnight
        newNode[0] = limit(newNode[0], 0, 24 - this.stepDuration)

        // check if new node is close to an existing one
        const index = this.nodes.findIndex(node =>
            Math.abs(node[0] - newNode[0]) <= this.stepDuration)
        if (index === -1) {
            // if not, add new node
            this.nodes.push([newNode[0], newNode[1]])
        }
        else {
            // if yes, modify node
            this.nodes[index][1] = newNode[1]
        }
        this.sortNodes()
    }

    /**
     * Remove nodes close to given time of day.
     * @param {number} tod - Time of day.
     */
    removeNodeAt(tod: number) {
        this.nodes = this.nodes.filter( node => 
            ((node[0] === 0) || (Math.abs(node[0] - tod) > this.stepDuration))
        )
    }

    /**
     * Sort nodes in ascending order with respect to time
     */
    sortNodes() {
        this.nodes.sort((a, b) => a[0] - b[0])
    }

    /**
     * Create an instance of this class from an object.
     * @param {Profile} json - Object carrying data of daily profile.
     */
    static fromJSON(json: Profile): DailyProfile {
        return new DailyProfile(json.nodes, json?.method, json?.stepDuration)
    }

}