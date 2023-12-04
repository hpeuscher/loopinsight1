exports.default = function (source, map) {
    this.callback(
        null,
        `export default function (Component) {
        Component.__svg = ${source}
        }`,
        map
    )
}