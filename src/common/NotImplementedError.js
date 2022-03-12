class NotImplementedError extends Error {
    constructor(className, methodName) {
        message = util.format(
            "Error: Method '%s' not implemented in class '%s'.",
            methodName, className)
        super(this.message)
        this.name = this.constructor.name
    }

}

export default NotImplementedError;