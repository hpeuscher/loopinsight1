/** 
 * This file is part of LoopInsighT1, an open source tool to
 * simulate closed-loop glycemic control in type 1 diabetes.
 * Distributed under the MIT software license.
 * See https://lt1.org for further information.
 */

/** unique id */
let uuid = 1

export default class HTMLTooltip {
    protected _tooltip: HTMLElement

    constructor(container: HTMLElement) {
        this._tooltip = document.createElement("div")
        this._tooltip.setAttribute("id", "d3_tooltip_" + uuid)
        this._tooltip.setAttribute("class", "tooltip")
        uuid = uuid + 1
        container.appendChild(this._tooltip)
    }

    hide() {
        this._tooltip.style.opacity = "0"
    }

    show() {
        this._tooltip.style.opacity = "1"
    }

    configure(x: number, y: number, html: string) {
        this._tooltip.innerHTML = html
        const ttWidth = this._tooltip.offsetWidth
        const ttHeight = this._tooltip.offsetHeight
        const inner_width = this._tooltip.parentElement?.getBoundingClientRect().width!
        this._tooltip.style.left = (x + 0*ttWidth < inner_width ? x : x - ttWidth) + "px"
        this._tooltip.style.top = (y - ttHeight) + "px"
    }

}