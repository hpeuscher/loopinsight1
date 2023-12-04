/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

import * as d3 from 'd3'
import HTMLTooltip from './HTMLTooltip.js'

export declare type D3ChartPoint = {
    t: Date,
    y: number,
    stroke?: string,
}

/**
 * Dataset to be displayed in chart.
 */
export declare type D3ChartDataset = {
    type: "line",
    label?: string,
    unit?: string,
    style?: string,
    data: D3ChartPoint[],
    description?: string,
    /** Function to convert numeric value to string in tooltip. */
    tooltipFormat?: (value: number) => string,
}


export declare type D3ChartOptions = {
    tmin?: Date,
    tmax?: Date,
    ylabel?: string,
    xlabel?: string,
    ymin?: number,
    ymax?: number,
}

/** unique id */
let uuid = 1
        
export default class D3Chart {
    /** options */
    public options: D3ChartOptions
    public datasets: Array<D3ChartDataset> = []
    public onUpdate: (chart: D3Chart) => void = () => {}
    public uuid: number
    protected _svgOuter: d3.Selection<SVGSVGElement, unknown, null, undefined>
    protected svg = {} as d3.Selection<SVGGElement, unknown, null, undefined>
    protected axis = {} as d3.Selection<SVGGElement, unknown, null, undefined>
    protected _xScale = {} as d3.AxisScale<Date>
    protected _yScale = {} as d3.AxisScale<number>
    protected _tooltip: HTMLTooltip
    public margin = { left: 60, top: 20, right: 20, bottom: 50 }

    
    /** creates a new chart */
    constructor(container: HTMLElement, options: D3ChartOptions = {}) {
        this.uuid = uuid
        uuid = uuid + 1
        this._tooltip = new HTMLTooltip(container)
        this._svgOuter = d3.select(container).append("svg")
        this.svg = this._svgOuter.append("g")
            .attr("id", "svg_inner_" + this.uuid)
        

        this.options = options
 
        /** size observer that calls back after resize event */
        const observer = new ResizeObserver(_entries => {
            this.update()
        })
        observer.observe(container)

    }

    /** x scale for transformation from value to position */
    get xScale() { return this._xScale }
    /** y scale for transformation from value to position */
    get yScale() { return this._yScale }
    /** tooltip element */
    get Tooltip() { return this._tooltip }

    /** draws axis to chart */
    protected _drawAxis(inner_width: number, inner_height: number) {

        const xScale = this._xScale
        const yScale = this._yScale
        const svg = this.svg

        const xTickCount = inner_width / 20 // TODO
        const yTickCount = inner_height / 20

        /** x axis */
        const xAxis = d3.axisBottom(xScale).ticks(d3.timeHour.every(1), "%H:%M")
        svg
            .append("g")
            .attr("class", "x axis")
            .attr("transform", `translate(0,${inner_height})`)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)")

        /** y axis */
        const yAxis = d3.axisLeft(yScale).ticks(yTickCount / 2)
        const yAxisElement = svg
            .append("g")
            .attr("class", "y axis")
            .call(yAxis)

        // x minor grid
        svg.append('g')
            .attr('class', 'x axis-minor-grid')
            .attr("transform", `translate(0,${inner_height})`)
            .call(xAxis.tickSize(-inner_height).tickFormat(() => "").ticks(xTickCount))

        // TODO : make sure minor ticks are symmetric between major ticks

        // y minor grid
        svg.append('g')
            .attr('class', 'y axis-minor-grid')
            .call(yAxis.tickSize(-inner_width).tickFormat(() => "").ticks(yTickCount))

        // x grid
        svg.append('g')
            .attr('class', 'x axis-grid')
            .attr("transform", `translate(0,${inner_height})`)
            .call(xAxis.tickSize(-inner_height).tickFormat(() => "").ticks(xTickCount / 2))

        // y grid
        svg.append('g')
            .attr('class', 'y axis-grid')
            .call(yAxis.tickSize(-inner_width).tickFormat(() => "").ticks(yTickCount / 2))

        // y axis label
        yAxisElement
            .append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -inner_height / 2)
            .attr("dy", -40)
            .style("text-anchor", "middle")
            .attr("fill", "#000000")
            .text(this.options?.ylabel ?? "")

    }

    /** Updates the chart. */
    update() {
        const bBox = this._svgOuter.node()!.parentElement!.getBoundingClientRect()
        const width = bBox.width
        const height = bBox.height
        /** margin of SVG */
        const margin = this.margin
        const inner_width = width - margin.left - margin.right
        const inner_height = height - margin.top - margin.bottom

        this._svgOuter
            .attr("width", width + "px")
            .attr("height", height + "px")

        this.svg.node()!.innerHTML = ""
        this.svg
            .attr("width", inner_width + "px")
            .attr("height", inner_height + "px")
            .attr("transform", `translate(${margin.left},${margin.top})`)

        // x scale options
        /** minimum time */
        const tmin = this.options.tmin ?? new Date(
            this.datasets.reduce((prev: number, dataset: D3ChartDataset) =>
                Math.min(prev, dataset.data.reduce(
                    (prev2, data) => Math.min(prev2, data.t.valueOf()), Infinity)),
                Infinity)
        )
        /** maximum time */
        const tmax = this.options.tmax ?? new Date(
            this.datasets.reduce((prev: number, dataset: D3ChartDataset) =>
                Math.max(prev, dataset.data.reduce(
                    (prev2, data) => Math.max(prev2, data.t.valueOf()), 0)),
                0)
        )

        /** x scale */
        this._xScale = d3.scaleTime()
            .domain([tmin, tmax])
            .range([0, inner_width])

        /** y scale */
        this._yScale = d3.scaleLinear()
            .domain([this.options.ymin ?? 0, this.options.ymax ?? 100])
            .range([inner_height, 0])

        this._drawAxis(inner_width, inner_height)

        this.axis = this.svg.append("g")
            .attr('clip-path', 'url(#clipPath'+this.uuid+')')

        this.axis.append('clipPath')
            .attr('id', 'clipPath'+this.uuid)
            .append('rect')
            .attr("width", inner_width)
            .attr("height", inner_height)


        for (const dataset of this.datasets) {
            if (dataset.type == "line") {
                this._drawLine(dataset)
            }
        }

        this.onUpdate(this)
    }

    /** Appends an element to the SVG. */
    public append(type: string) {
        return this.svg.append(type)
    }

    /**
     * Draws a dataset that describes a line.
     * @param {D3ChartDataset} dataset - Data object describing line.
     */
    protected _drawLine(dataset: D3ChartDataset) {
        const xScale: d3.AxisScale<Date> = this._xScale
        const yScale = this._yScale!
        const axis = this.axis

        const data = dataset.data

        const line = axis
            .append("g")
            .attr("class", "lt1-chart-line")
            .selectAll("BGchartdata")
            .data(data.slice(1))
            .enter()
            .append("line")
            .attr("stroke", (d: D3ChartPoint) => d.stroke ?? "black")
            .attr("x1", (_d: D3ChartPoint, i: number) => xScale(data[i].t)!)
            .attr("y1", (_d: D3ChartPoint, i: number) => yScale(data[i].y)!)
            .attr("x2", (_d: D3ChartPoint, i: number) => xScale(data[i + 1].t)!)
            .attr("y2", (_d: D3ChartPoint, i: number) => yScale(data[i + 1].y)!)
            // .attr("stroke-width", "3px")

        if (typeof dataset.style !== "undefined") {
            line.attr("style", dataset.style)
        }

        // overlay tooltip area
        axis.append('g')
            .selectAll("lt1-tooltip-area")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", (d: D3ChartPoint) => xScale(d.t)!)
            .attr("y", (d: D3ChartPoint) => yScale(d.y)! - 10)
            .attr("width", 5)
            .attr("height", 20)
            .style("opacity", 0)
            .style("pointer-events", "all")
            .on("mousemove", (event: MouseEvent, d: D3ChartPoint) =>
                this._mousemove(event, d, dataset))
            .on("mouseover", () => this._tooltip.show())
            .on("mouseleave", () => this._tooltip.hide())

    }

    /** 
     * Callback method for mouseover event.
     * @param{MouseEvent} event - Mouse event carrying position.
     * @param{D3ChartPoint} d - Data point in proximity of mouse.
     * @param{D3ChartDataset} dataset - Dataset the point belongs to.
     */
    protected _mousemove(event: MouseEvent, d: D3ChartPoint, dataset: D3ChartDataset) {
        // TODO: translation
        const time = d.t.toLocaleTimeString().slice(0, 5) + " Uhr:"
        const label = dataset.label ?? ""
        const unit = dataset.unit ?? ""
        const valueString = dataset.tooltipFormat?.(d.y) || d.y.toString()
        const x = (this.xScale(d.t) || event.offsetX) + this.margin.left
        const y = (this.yScale(d.y) || event.offsetY) + this.margin.top
        const content = time + "<br/>" + label + ": " + valueString + " " + unit + 
            (dataset.description ? "<br/>" + dataset.description : "")
        this._tooltip.configure(x, y, content)

    }

}