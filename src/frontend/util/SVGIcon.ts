/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */


/**
 * Adds an icon to an SVG.
 * @param g - g element in SVG to draw icon into
 * @param{string} iconPath - Path description (d attribute of path)
 * @param{string} color - Fill color.
 * @returns g element.
 */
const createIcon = function(g: d3.Selection<SVGGElement, unknown, null, undefined>, 
        iconPath: string, color: string = "black") {
    g.append("circle")
        .attr("cx", 40)
        .attr("cy", 40)
        .attr("r", 40)
        .attr("style", "fill: "+color+";")
        .attr("transform", "translate(-20,-20) scale(0.5)")
    g.append("path")
        .attr("d", iconPath)
        .attr("style", "fill: white; fill-rule: nonzero;")
        .attr("transform", "translate(-20,-20) scale(0.5)")
    return g
}

export const createBolusIcon = 
function(g: any, 
    color = "#0055A3") {
    const bolusIcon = "M60.072,30.217l1.928,-1.928l-10.288,-10.289l-1.928,1.928l4.18,4.18l-3.859,3.859l-6.108,-6.108l-1.928,1.928l2.249,2.249l-23.364,23.364l3.859,3.859l-6.813,6.813l1.928,1.928l6.813,-6.813l3.859,3.859l23.364,-23.364l2.249,2.249l1.928,-1.928l-6.108,-6.108l3.859,-3.859l4.18,4.181Zm-29.472,24.973l-5.79,-5.79l3.913,-3.913l2.895,2.895l1.928,-1.928l-2.895,-2.895l3.913,-3.913l2.895,2.895l1.928,-1.928l-2.895,-2.895l3.913,-3.913l2.895,2.895l1.928,-1.928l-2.895,-2.895l3.913,-3.913l5.79,5.79l-21.436,21.436Z"
    return createIcon(g, bolusIcon, color)
}

export const createMealIcon =
function(g: any, 
    color = "#88cc88") {
    const mealIcon = "M38.167,34.5l-3.667,0l0,-12.833l-3.667,-0l0,12.833l-3.666,0l-0,-12.833l-3.667,-0l0,12.833c0,3.887 3.043,7.04 6.875,7.278l0,16.555l4.583,0l0,-16.555c3.832,-0.238 6.875,-3.391 6.875,-7.278l0,-12.833l-3.666,-0l-0,12.833Zm9.166,-5.5l0,14.667l4.584,-0l-0,14.666l4.583,0l-0,-36.666c-5.06,-0 -9.167,4.106 -9.167,7.333Z"
    return createIcon(g, mealIcon, color)
}

export const createAnnouncementIcon =
function(g: any, 
    color = "#cccc88") {
    const announcementIcon = "M51,38.167l0,3.666l7.333,0l0,-3.666l-7.333,-0Zm-3.667,12.118c1.76,1.302 4.052,3.025 5.867,4.382c0.733,-0.972 1.467,-1.962 2.2,-2.934c-1.815,-1.356 -4.107,-3.08 -5.867,-4.4c-0.733,0.99 -1.466,1.98 -2.2,2.952Zm8.067,-22.018c-0.733,-0.972 -1.467,-1.962 -2.2,-2.934c-1.815,1.357 -4.107,3.08 -5.867,4.4c0.734,0.972 1.467,1.962 2.2,2.934c1.76,-1.32 4.052,-3.025 5.867,-4.4Zm-30.067,6.233c-2.016,0 -3.666,1.65 -3.666,3.667l-0,3.666c-0,2.017 1.65,3.667 3.666,3.667l1.834,0l-0,7.333l3.666,0l0,-7.333l1.834,0l9.166,5.5l0,-22l-9.166,5.5l-7.334,0Zm21.084,5.5c-0,-2.438 -1.064,-4.638 -2.75,-6.142l-0,12.265c1.686,-1.485 2.75,-3.685 2.75,-6.123Z"
    return createIcon(g, announcementIcon, color)
}
