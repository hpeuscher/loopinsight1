class InvalidResultError extends Error {
    constructor(result) {
        message = "Error: Invalid simulation result: '%{result}'.";
        super(this.message)
        this.name = this.constructor.name
    }

}

export default InvalidResultError;