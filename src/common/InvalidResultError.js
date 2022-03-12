class InvalidResultError extends Error {
    constructor(result) {
        message = util.format(
            "Error: Invalid simulation result: '%s'.",
            )
        super(this.message)
        this.name = this.constructor.name
    }

}

export default InvalidResultError;