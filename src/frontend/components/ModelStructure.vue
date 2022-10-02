<script>
/* 	This file is part of LoopInsighT1, an open source tool to
   	simulate closed-loop glycemic control in type 1 diabetes.
   	Distributed under the MIT software license.
	See https://lt1.org for further information.	*/

import { SVG } from '@svgdotjs/svg.js'

// check if argument is a valid number
const isNumber = function (value) { 
    return typeof value === "number" && isFinite(value)
}

// retrieve geometry information from node id
function getGeometryOfNode(edge, nodes) {
    if (edge.id in nodes) {
        edge.x = nodes[edge.id].x
        edge.y = nodes[edge.id].y
        edge.radius = getRadius(nodes[edge.id].geometry)
    }
    return edge
}

// retrieve geometry information of existing connection
function getGeometryOfConnection(edge, svg) {
    if (typeof edge.id === "undefined") {
        return edge
    }
    const con = svg.findOne("#"+edge.id)
    if (con !== null) {
        if (!isNumber(edge.at)) {
            // if no position is given, chose middle
            edge.at = 0.5
        }
        const p = con.pointAt(con.length()*edge.at)
        edge.x = p.x
        edge.y = p.y
    }
    return edge
}

// compute radius of shapes as function of angle
function getRadius(geometry) {
    switch(geometry.shape) {
        case "circle":
            return function (angle) {
                return geometry.d/2
            }
        case "square":
            return function (angle) {
                // formula for polar coordinate of cube
                return geometry.d/2/Math.cos( Math.PI/2*Math.abs(2*angle/180 - Math.floor(2*angle/180+0.5)) )
            }
    }
    return undefined
}

// compute path to connect two nodes, connections, or points.
//   "from" and "to" must have the following entries
//   - x, y: coordinates
//   - angle (optional): angle (in deg) of path at this edge
//   - radius (optional): border distance from x,y, either as a number or a function of angle 
function getArc(connection) {
    if (typeof connection.from === "undefined" || typeof connection.to === "undefined") {
        return ""
    }

    let from = connection.from
    let to = connection.to

    // if angle is not specified, point straight to the other edge
    if (!isNumber(from.angle)) {
        from.angle = Math.atan2(from.y-to.y, to.x-from.x)*180/Math.PI
    }
    if (!isNumber(to.angle)) {
        to.angle = Math.atan2(to.y-from.y, from.x-to.x)*180/Math.PI
    }

    // if edge has a radius, start from its border
    if (typeof from.radius === "function") {
        from.radius = from.radius(from.angle)
    }
    else if (typeof from.radius === "undefined") { from.radius = 0 }
    
    if (typeof to.radius === "function") {
        to.radius = to.radius(to.angle)
    }
    else if (typeof to.radius === "undefined") { to.radius = 0 }

    // compute path
    return Arc(from.x, from.y, from.radius, from.angle, to.x, to.y, to.radius, to.angle)
}

// compute path to connect two edges
function Arc(x1, y1, r1, angle1, x2, y2, r2, angle2) {
    if (!isNumber(x1) || !isNumber(y1) || !isNumber(r1) || !isNumber(angle1) ||
        !isNumber(x2) || !isNumber(y2) || !isNumber(r2) || !isNumber(angle2))
    {
        return ""
    }
    // distance between center points
    let d = Math.hypot( x1-x2, y1-y2 )
    // controls
    let i1 = {  x: (x1+d/2*Math.cos(Math.PI/180*angle1)),
                y: (y1-d/2*Math.sin(Math.PI/180*angle1))}
    let i2 = {  x: (x2+d/2*Math.cos(Math.PI/180*angle2)),
                y: (y2-d/2*Math.sin(Math.PI/180*angle2))}
    // svg path
    return  "M"  + (x1+r1*Math.cos(Math.PI/180*angle1)) + 
            " "  + (y1-r1*Math.sin(Math.PI/180*angle1)) + 
            " C" + i1.x + " " + i1.y + 
            " "  + i2.x + " " + i2.y +
            " "  + (x2+r2*Math.cos(Math.PI/180*angle2)) + 
            " "  + (y2-r2*Math.sin(Math.PI/180*angle2))
}

// draw no
function addNode(svg, geometry) {
    switch(geometry.shape) {
        case "circle":
            if (typeof geometry.d === "undefined") {
                error("circle needs parameter d.")
            }
            if (typeof geometry.doubleLine !== "undefined") {
                svg.circle(geometry.d-6).center(0,0).addClass("thin")
            }
            return svg.circle(geometry.d).center(0,0)

        case "square":
            if (typeof geometry.d === "undefined") {
                error("square needs parameter d.")
            }
            if (typeof geometry.doubleLine !== "undefined") {
                svg.rect(geometry.d-6,geometry.d-6).center(0,0).addClass("thin")
            }
            return svg.rect(geometry.d,geometry.d).center(0,0)
    }
}

// add tooltip to element
function addTooltip(elem, text) {
    if (typeof text === "undefined") {
        return
    }
    elem.mouseenter(function() {
        let tooltip = document.getElementById("tooltip");
        tooltip.innerHTML = text
        tooltip.style.display = "block"
        tooltip.style.left = elem.rbox().x + elem.rbox().width*0.1 + 'px'
        tooltip.style.top = elem.rbox().y + elem.rbox().height+2 + 'px'
        this.addClass("activesignal")
    })
    elem.mouseleave(function() {
        let tooltip = document.getElementById("tooltip")
        tooltip.style.display = "none"
        this.removeClass("activesignal")
    })
}


export default {
	props: {
        selectedModel: String,  // accept model selection 
    },

    data() {
		return {
            model: this.selectedModel,
			modelInfo: __LT1_LOCAL_MODELS__,	// provided by webpack define plugin
			modelImports: {},
		}
	},

    computed: {
		modelList: function() { return Object.keys(this.modelInfo) },
	},

	beforeMount() {
		// import module dynamically
		for (const key of this.modelList) {
			this.modelImports[key] = () => import(
				/* webpackChunkName: "models_[request]" */ 
				/* webpackMode: "lazy" */
				`../../core/models/${key}`
			)
		}
	},

    mounted() {
        this.selectionChanged()
    },

	methods: {

        selectionChanged() {
            // check if valid model is selected
            if (this.model.length === 0) {
                if (this.selectedModel.length === 0) {
                    return
                }
                else {
                    this.model = this.selectedModel
                }
            }
            if (this.modelList.indexOf(this.model) < 0 ) {
                console.log("unknown model \""+this.model+"\"")
                return
            }
            console.log("selected model: \""+this.model+"\"")
            
            //const model = this.modelRefs[this.model]
            const modelModule = this.modelImports[this.model]()
			modelModule.then( (model) => {
                this.renderSVG(model)
            })
             
        },

        renderSVG(model) {

            // find SVG in DOM
            let svgelem = document.getElementById("lt1_model_svg")
            let draw = SVG(svgelem)
            // clear SVG
            if (draw.children().length > 1) {
                // SVG has already been created
                // (the alternative would be to clear it and rebuild it,
                //  but calling clear() removes also the arrow defs)
                return
            }

            const elements = model.diagram

            const tooltipStrings = model.i18n[this.$i18n.locale] || model.i18n[this.$i18n.fallbackLocale] 
            const parameterTooltip = (key) => tooltipStrings[key] || key
            const htmlStrings = model.html || {}
            const parameterHtml = (key) => htmlStrings[key] || key
            // const unitStrings = model.units || {}
            // const parameterUnit = (key) => unitStrings[key]

            // draw subsystems
            for (const s of elements.subsystems) {
                let g = draw.group().addClass("subsystem")
                let r = g.rect(s.width, s.height).attr({rx:10, ry:10, fill: s.fill})
                if (typeof s.label !== "undefined") {
                    let l = g.text(s.label.text).center(s.width/2,s.height-10)
                }
                g.move(s.x, s.y)
            }

            // draw nodes
            for (const id in elements.nodes) {
                const s = elements.nodes[id]
                // create group
                let g = draw.group()
                    .addClass("signal")
                    .transform({translate: [s.x, s.y]})
                let n = addNode(g, s.geometry)
                
                if (typeof s.class !== "undefined") {
                    g.addClass(s.class)
                }

                // add label as SVG text (plain)
                // let t = g.text(s).center(0,0)

                // add label as HTML text (formatted)
                let fObj = g.foreignObject(g.bbox().width,g.bbox().height)
                var div = document.createElement('div')
                div.classList.add("signal")
                div.innerHTML = "<span>" + parameterHtml(id) + "</span>"
                let t = fObj.add(div)
                fObj.center(0,0)

                // add tooltip
                addTooltip(g, parameterTooltip(id))
            }

            // draw inputs
            for (const id in elements.inputs) {
                const s = elements.inputs[id]
                if (typeof s.to === "undefined") {
                    continue
                }
                s.to = getGeometryOfNode(s.to, elements.nodes)
                // create SVG group
                let g = draw.group()
                // add label
                let l = g.text(parameterHtml(id)).addClass("label")
                //l.center(s.to.x-l.bbox().width/2-5, s.to.y)
                l.move(2, -l.bbox().height/2)
                const w = Math.max(l.bbox().width + 4, 30)
                let p = g.path("M-2,-10 h"+w+" v-5 l15 15 l-15 15 v-5 h-"+w+" Z").addClass("input")
                l.front()
                g.move( s.to.x - Math.cos(s.to.angle * Math.PI / 180)*s.to.radius(s.to.angle) - g.bbox().width, 
                        s.to.y - Math.sin(s.to.angle * Math.PI / 180)*s.to.radius(s.to.angle) - g.bbox().height/2)
                // add tooltip
                addTooltip(g, parameterTooltip(id))
            }

            // draw connections
            for (const s of elements.connections) {
                if (typeof s.from === "undefined" || typeof s.to === "undefined") {
                    continue
                }
                // create SVG group
                let g = draw.group()

                // find path
                let d = s.d
                if (typeof d === "undefined") {
                    // connection between "from" and "to"
                    s.from = getGeometryOfNode(s.from, elements.nodes)
                    s.to = getGeometryOfNode(s.to, elements.nodes)
                    s.from = getGeometryOfConnection(s.from, draw)
                    s.to = getGeometryOfConnection(s.to, draw) 

                    d = getArc(s)
                }
                
                // draw connection
                let p = g.path(d)
                p.addClass("connection")
                // add id
                if (typeof s.id === "string") {
                    p.attr({id: s.id})
                }
                // add css classes
                if (s.type == "arrow") {
                    p.attr({"marker-end":"url(#arrow)"})
                }
                // add style options
                if (typeof s.style !== "undefined" & s.style!=="") {
                    p.attr({style: s.style})
                }
                // add label
                if (typeof s.label !== "undefined" ) {
                if (typeof s.label.text !== "undefined" && s.label.text !== "") {
                    // find point in the middle and path direction
                    let p1 = p.pointAt(p.length()*0.5)
                    let p2 = p.pointAt(p.length()*0.51)
                    let dir = {x: p2.x-p1.x, y: p2.y-p1.y }
                    let len = Math.hypot(dir.x, dir.y)
                    dir = {x: dir.x/len, y: dir.y/len }
                    // place label alongside path
                    let l = g.text(s.label.text).addClass("label")
                    l.center(p1.x+Math.abs(dir.y)*l.bbox().width*0.7, 
                             p1.y-Math.abs(dir.x)*l.bbox().height*0.7)

                    //let l = g.text(s.label.text).addClass("label").center(p1.x,p1.y-8)
                    addTooltip(g, parameterTooltip(s.label.text))
                } }
            }

            // tighten viewbox and scale viewport accordingly
            draw.viewbox(draw.bbox())
            draw.attr({viewBox: draw.bbox(), width: draw.bbox().width, height: draw.bbox().height})
        },
    }
}
</script>


<template>
	<div>
        <p v-show="model==''">
            Select model: 
            <select v-model="model" @change="selectionChanged">
                <option v-for="m in modelList" :value="m" :key="m">{{m}}</option>
            </select>
        </p>
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
/*html {
	font-family:Calibri; 
	font-weight:400; 
	font-size:16px; 
}*/

#tooltip {
	background: white;
	border: 1px solid black;
	border-radius: 5px;
	padding: 5px;
	font-size:16px; 
}
div.signal {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
text {
    font-size:1.2rem;
    text-anchor:middle;
    pointer-events:visible;
}
.signal > rect, .signal > circle { stroke:#333333; stroke-width:2; fill:none; pointer-events:visible; }
.activesignal { color: #DD0000; }
.activesignal > rect, .activesignal > circle, .activesignal > path { stroke: #DD0000; }
.activesignal > text { fill: #DD0000; }
#arrow { fill:#333333; }
/*.activesignal #arrow { fill:#DD0000!important; }*/
.connection { stroke:#333333; stroke-width:1.5; stroke-linejoin:round; fill:none; }
text.label { font-size: 1rem;}
path.input { fill: #eeeeee; stroke:#333333; stroke-width:1.5; }
.thin { stroke-width: 0.5!important; }
</style>

