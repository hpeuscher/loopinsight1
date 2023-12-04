/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

export type Vector = number[]

export type Matrix = number[][]

export type NamedVector = {
    [id in string]: number
}
