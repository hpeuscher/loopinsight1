/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

export declare type Translation = {
    [key: string]: string
}

declare type StructureDiagram = {
    nodes: NodeList
    connections: Array<Connection>
    subsystems?: Array<Subsystem>
    inputs?: Array<InputSignal>
    tooltipStrings?: Translation
    htmlStrings?: Translation
}
export default StructureDiagram

export declare type Shape = "square" | "circle" | "ellipse"

export declare type Geometry = {
    shape: Shape
    d?: number
    dx?: number
    dy?: number
    doubleLine?: boolean
}

export declare type Edge = {
    id?: string
    at?: number
    x?: number
    y?: number
    radius?: number | Function
    angle: number
}

export declare type NodeList = {
    [key: string]: Node
}

export declare type Node = {
    class?: string
    x: number
    y: number
    geometry: Geometry
    style?: string
}

export declare type Connection = {
    id?: string
    d?: string
    from: Edge
    to: Edge
    style?: string
    type?: string
    label?: Label
}

export declare type Label = {
    text: string
    at: number
}

export declare type InputSignal = {
    to: Edge
}

export declare type Subsystem = {
    x: number
    y: number
    width: number
    height: number
    label: Label
    fill: string
}
