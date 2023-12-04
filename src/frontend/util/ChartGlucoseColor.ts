/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { Point, ScriptableContext, ScriptableLineSegmentContext } from 'chart.js'

export function glucoseColorLine(ctx: ScriptableContext<"line">) {
    const value = <Point>ctx.dataset.data[ctx.dataIndex]
    return glucoseColor(value?.y)
}

export function glucoseColorLineSegment(ctx: ScriptableLineSegmentContext) {
    const mn = Math.min(ctx.p0.parsed.y, ctx.p1.parsed.y)
    const mx = Math.max(ctx.p0.parsed.y, ctx.p1.parsed.y)

    if (mn < 54)
        return glucoseColor(mn)
    if (mx > 250)
        return glucoseColor(mx)
    if (mn < 70)
        return glucoseColor(mn)

    return glucoseColor(mx)
}

export default function glucoseColor(value: number): string {
    if (value < 54)
        return 'rgb(140,25,22,1)'	// very low
    if (value < 70)
        return 'rgb(194,1,18,1)'	// low
    if (value > 250)
        return 'rgb(233,181,17,1)'	// very high
    if (value > 180)
        return 'rgb(250,234,0,1)'	// high

    return 'rgb(120,176,89,1)'  	// target
}
