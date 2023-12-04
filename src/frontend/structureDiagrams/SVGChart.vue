<script lang="ts">
/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import { PropType, defineComponent } from 'vue'
import { SVG, Dom, Path, Container, Element } from '@svgdotjs/svg.js'
import StructureDiagram, {
    Connection, Edge, Geometry, NodeList
} from '../../types/StructureDiagram.js'


// check if argument is a valid number
const isNumber = function (value: any) {
    return typeof value === "number" && isFinite(value)
}

// retrieve geometry information from node id
function getGeometryOfNode(edge: Edge, nodes: NodeList) {
    if (typeof edge.id !== "undefined" && edge.id in nodes) {
        edge.x = nodes[edge.id].x
        edge.y = nodes[edge.id].y
        edge.radius = getRadius(nodes[edge.id].geometry)
    }
    return edge
}

// retrieve geometry information of existing connection
function getGeometryOfConnection(edge: Edge, svg: Dom) {
    if (typeof edge.id === "undefined") {
        return edge
    }
    const con = <Path>svg.findOne("#" + edge.id)
    if (con !== null) {
        // if no position is given, chose middle
        const p = con.pointAt(con.length() * (edge.at ?? 0.5))
        edge.x = p.x
        edge.y = p.y
    }
    return edge
}

// compute radius of shapes as function of angle
function getRadius(geometry: Geometry) {
    switch (geometry.shape) {
        case "circle":
            return function (_angle: number) {
                console.assert((geometry.d || 0) > 0, "diameter d missing")
                return geometry.d! / 2
            }
        case "ellipse":
            return function (angle: number) {
                console.assert((geometry.dx || 0) > 0, "diameter dx missing")
                console.assert((geometry.dy || 0) > 0, "diameter dy missing")
                return geometry.dx! * geometry.dy! / 4 / Math.sqrt(
                    Math.pow(geometry.dx! / 2 * Math.sin(Math.PI / 180 * angle), 2) +
                    Math.pow(geometry.dy! / 2 * Math.cos(Math.PI / 180 * angle), 2))
            }
        case "square":
            return function (angle: number) {
                // formula for polar coordinate of cube
                console.assert((geometry.d || 0) > 0, "diameter d missing")
                return geometry.d! / 2 / Math.cos(Math.PI / 2 *
                    Math.abs(2 * angle / 180 - Math.floor(2 * angle / 180 + 0.5)))
            }
    }
    return undefined
}

/** 
 * Computes path to connect two nodes, connections, or points.
 * 
 * @param{Connection} connection - 
 *      "from" and "to" must have the following entries:
 *      - x, y: coordinates
 *      - angle (optional): angle (in deg) of path at this edge
 *      - radius (optional): border distance from x,y, 
 *          either as a number or a function of angle 
 */
function getArc(connection: Connection) {
    const from = connection.from
    const to = connection.to

    if (typeof from === "undefined"
        || typeof to === "undefined"
        || typeof from.x === "undefined"
        || typeof from.y === "undefined"
        || typeof to.x === "undefined"
        || typeof to.y === "undefined") {
        return ""
    }


    // if angle is not specified, point straight to the other edge
    if (!isNumber(from.angle)) {
        from.angle = Math.atan2(from.y - to.y, to.x - from.x) * 180 / Math.PI
    }
    if (!isNumber(to.angle)) {
        to.angle = Math.atan2(to.y - from.y, from.x - to.x) * 180 / Math.PI
    }

    // if edge has a radius, start from its border
    let r1
    if (typeof from.radius === "function") {
        r1 = from.radius(from.angle)
    }
    else r1 = from.radius || 0

    let r2
    if (typeof to.radius === "function") {
        r2 = to.radius(to.angle)
    }
    else r2 = to.radius || 0

    // compute path
    return Arc(from.x, from.y, r1, from.angle, to.x, to.y, r2, to.angle)
}

/** 
 * Computes path to connect two edges.
 * 
 * @param{number} x1 - x-coordinate of first edge.
 * @param{number} y1 - y-coordinate of first edge.
 * @param{number} r1 - distance to keep from first edge.
 * @param{number} angle1 - angle to start from, in degree.
 * @param{number} x2 - x-coordinate of second edge.
 * @param{number} y2 - y-coordinate of second edge.
 * @param{number} r2 - distance to keep from second edge.
 * @param{number} angle2 - angle to arrive at, in degree.
 */
function Arc(x1: number, y1: number, r1: number, angle1: number,
    x2: number, y2: number, r2: number, angle2: number): string {
    if (!isNumber(x1) || !isNumber(y1) || !isNumber(r1) || !isNumber(angle1) ||
        !isNumber(x2) || !isNumber(y2) || !isNumber(r2) || !isNumber(angle2)) {
        return ""
    }
    // distance between center points
    let d = Math.hypot(x1 - x2, y1 - y2)
    // controls
    let i1 = {
        x: (x1 + d / 2 * Math.cos(Math.PI / 180 * angle1)),
        y: (y1 - d / 2 * Math.sin(Math.PI / 180 * angle1))
    }
    let i2 = {
        x: (x2 + d / 2 * Math.cos(Math.PI / 180 * angle2)),
        y: (y2 - d / 2 * Math.sin(Math.PI / 180 * angle2))
    }
    // svg path
    return "M" + (x1 + r1 * Math.cos(Math.PI / 180 * angle1)) +
        " " + (y1 - r1 * Math.sin(Math.PI / 180 * angle1)) +
        " C" + i1.x + " " + i1.y +
        " " + i2.x + " " + i2.y +
        " " + (x2 + r2 * Math.cos(Math.PI / 180 * angle2)) +
        " " + (y2 - r2 * Math.sin(Math.PI / 180 * angle2))
}

/**
 * Adds a node to SVG container
 * @param {Container} svg - SVG container
 * @param {Geometry} geometry - description of new node
 */
function addNode(svg: Container, geometry: Geometry) {
    switch (geometry.shape) {
        case "circle":
            if (typeof geometry.d === "undefined") {
                throw new Error("circle needs parameter d.")
            }
            if (typeof geometry.doubleLine !== "undefined") {
                svg.circle(geometry.d - 6).center(0, 0).addClass("thin")
            }
            return svg.circle(geometry.d).center(0, 0)

        case "ellipse":
            if (typeof geometry.dx === "undefined") {
                throw new Error("ellipse needs parameter dx.")
            }
            if (typeof geometry.dy === "undefined") {
                throw new Error("ellipse needs parameter dy.")
            }
            if (typeof geometry.doubleLine !== "undefined") {
                svg.ellipse(geometry.dx - 6, geometry.dy - 6).center(0, 0).addClass("thin")
            }
            return svg.ellipse(geometry.dx, geometry.dy).center(0, 0)

        case "square":
            if (typeof geometry.d === "undefined") {
                throw new Error("square needs parameter d.")
            }
            if (typeof geometry.doubleLine !== "undefined") {
                svg.rect(geometry.d - 6, geometry.d - 6).center(0, 0).addClass("thin")
            }
            return svg.rect(geometry.d, geometry.d).center(0, 0)
    }
}

/**
 * Adds tooltip to element.
 * @param {Element} elem - element id in HTML document
 * @param {String} text 
 */
function addTooltip(elem: Element, text: string) {
    if (typeof text === "undefined" || text === "") {
        return
    }
    elem.mouseenter(function () {
        const tooltip = document.getElementById("tooltip")!
        tooltip.innerHTML = text
        tooltip.style.display = "block"
        tooltip.style.left = elem.rbox().x + elem.rbox().width * 0.1 + 'px'
        tooltip.style.top = elem.rbox().y + elem.rbox().height + 2 + 'px'
        elem.addClass("activenode")
    })
    elem.mouseleave(function () {
        const tooltip = document.getElementById("tooltip")!
        tooltip.style.display = "none"
        elem.removeClass("activenode")
    })
}

/**
 * Defines Vue component.
 */
export default defineComponent({
    props: {
        /** diagram description */
        diagram: {
            type: Object as PropType<StructureDiagram>,
            required: true
        },
    },

    data() {
    },

    mounted() {
        this.renderSVG(this.diagram)
    },

    watch: {
        "diagram": {
            handler: function (val) {
                this.renderSVG(val)
            },
            immediate: true,
        },
    },


    methods: {
        renderSVG(diagram: StructureDiagram) {

            if (typeof diagram === "undefined") return

            // find SVG in DOM
            let svgelem = document.getElementById("lt1_model_svg")
            let draw = <Container>SVG(svgelem)
            if (draw === null) return
            if (draw.children().length > 1) {
                // SVG has already been created
                // (the alternative would be to clear it and rebuild it,
                //  but calling clear() removes also the arrow defs)
                return
            }

            if (typeof diagram === "undefined") return
            const parameterTooltip = (key: string) =>
                diagram?.tooltipStrings?.[key] || ""
            const parameterHtml = (key: string) =>
                diagram?.htmlStrings?.[key] || key


            // draw subsystems
            for (const s of diagram.subsystems || []) {
                let g = draw.group().addClass("subsystem")
                let r = g.rect(s.width, s.height).attr({ rx: 10, ry: 10, fill: s.fill })
                if (typeof s.label !== "undefined") {
                    let l = g.text(s.label.text).center(s.width / 2, s.height - 10)
                }
                g.move(s.x, s.y)
            }

            // draw nodes
            for (const id in diagram.nodes || []) {
                const s = diagram.nodes[id]
                // create group
                let g = draw.group()
                    .addClass("node")
                    .transform({ translate: [s.x, s.y] })
                    .attr({ id: "node_" + id })
                let n = addNode(g, s.geometry)
                // add style options
                if (typeof s.style !== "undefined" && s.style !== "") {
                    n.attr({ style: s.style })
                }
                // add css class
                if (typeof s.class !== "undefined") {
                    g.addClass(s.class)
                }

                // add label as SVG text (plain)
                // let t = g.text(s).center(0,0)

                // add label as HTML text (formatted)
                let fObj = g.foreignObject(g.bbox().width, g.bbox().height)
                let div: any = document.createElement('div')
                div.classList.add("node")
                div.innerHTML = "<span>" + parameterHtml(id) + "</span>"
                fObj.add(div)
                fObj.center(0, 0)

                // add tooltip
                addTooltip(g, parameterTooltip(id))
            }

            // draw inputs
            for (const id in diagram.inputs || []) {
                const s = diagram.inputs![id]
                if (typeof s.to === "undefined") {
                    continue
                }
                s.to = getGeometryOfNode(s.to, diagram.nodes)
                // create SVG group
                let g = draw.group()
                // add label
                let l = g.text(parameterHtml(id)).addClass("label")
                //l.center(s.to.x-l.bbox().width/2-5, s.to.y)
                l.move(2, -l.bbox().height / 2)
                const w = Math.max(l.bbox().width + 4, 30)
                let p = g.path("M-2,-10 h" + w + " v-5 l15 15 l-15 15 v-5 h-" + w + " Z").addClass("input")
                l.front()
                let radius
                if (typeof s.to.radius === "function") {
                    radius = s.to.radius(s.to.angle)
                }
                else radius = s.to.radius || 0

                g.move(s.to.x! - Math.cos(s.to.angle * Math.PI / 180) * radius - g.bbox().width,
                    s.to.y! - Math.sin(s.to.angle * Math.PI / 180) * radius - g.bbox().height / 2)
                // add tooltip
                addTooltip(g, parameterTooltip(id))
            }

            // draw connections
            for (const s of diagram.connections || []) {
                if (typeof s.from === "undefined" || typeof s.to === "undefined") {
                    continue
                }
                // create SVG group
                let g = draw.group()

                // find path
                let d = s.d
                if (typeof d === "undefined") {
                    // connection between "from" and "to"
                    s.from = getGeometryOfNode(s.from, diagram.nodes)
                    s.to = getGeometryOfNode(s.to, diagram.nodes)
                    s.from = getGeometryOfConnection(s.from, draw)
                    s.to = getGeometryOfConnection(s.to, draw)

                    d = getArc(s)
                }

                // draw connection
                let p = g.path(d)
                p.addClass("connection")
                // add id
                if (typeof s.id === "string") {
                    p.attr({ id: s.id })
                }
                // add css classes
                if (s.type == "arrow") {
                    p.attr({ "marker-end": "url(#arrow)" })
                }
                // add style options
                if (typeof s.style !== "undefined" && s.style !== "") {
                    p.attr({ style: s.style })
                }
                // add label
                if (typeof s.label !== "undefined") {
                    if (typeof s.label.text !== "undefined" && s.label.text !== "") {
                        const at = s.label.at || 0.5
                        // find point in the middle and path direction
                        let p1 = p.pointAt(p.length() * Math.abs(at))
                        let p2 = p.pointAt(p.length() * Math.abs(at + 0.01))
                        let dir = { x: p2.x - p1.x, y: p2.y - p1.y }
                        let len = Math.hypot(dir.x, dir.y)
                        dir = { x: dir.x / len, y: dir.y / len }
                        // place label alongside path
                        let l = g.text(s.label.text).addClass("label")
                        l.center(p1.x + Math.abs(dir.y) * l.bbox().width * 0.7 * Math.sign(at),
                            p1.y - Math.abs(dir.x) * l.bbox().height * 0.7 * Math.sign(at))

                        //let l = g.text(s.label.text).addClass("label").center(p1.x,p1.y-8)
                        addTooltip(g, parameterTooltip(s.label.text))
                    }
                }
            }

            // tighten viewbox and scale viewport accordingly
            draw.viewbox(draw.bbox())
            draw.attr({ viewBox: draw.bbox(), width: draw.bbox().width, height: draw.bbox().height })
        },
    }
})
</script>


<template>
    <div>
        <svg id="lt1_model_svg" width="800" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
            <defs>
                <marker id="arrow" orient="auto" markerWidth="10" markerHeight="4" refX="4.7" refY="2">
                    <path d="M0,0 V4 L5,2 Z" class="arrow" />
                </marker>
            </defs>
        </svg>
        <div id="tooltip" display="none" style="position: absolute; display: none;"></div>
    </div>
</template>


<style lang="css">
#tooltip {
    background: white;
    border: 1px solid black;
    border-radius: 5px;
    padding: 5px;
    font-size: 16px;
}

div.node {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

text {
    font-size: 1rem;
    text-anchor: middle;
    pointer-events: visible;
}

.node>rect,
.node>circle,
.node>ellipse {
    stroke: #333333;
    stroke-width: 2;
    fill: none;
    pointer-events: visible;
}

.activenode {
    color: #DD0000;
}

.activenode>rect,
.activenode>circle,
.activenode>ellipse,
.activenode>path {
    stroke: #DD0000;
}

.activenode>text {
    fill: #DD0000;
}

#arrow {
    fill: #333333;
}

.connection {
    stroke: #333333;
    stroke-width: 1.5;
    stroke-linejoin: round;
    fill: none;
}

text.label {
    font-size: 1rem;
}

path.input {
    fill: #eeeeee;
    stroke: #333333;
    stroke-width: 1.5;
}

.thin {
    stroke-width: 0.5 !important;
}
</style>

