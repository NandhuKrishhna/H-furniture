class AppError extends Error {
    constructor(statusCode, message, errorCode = 'UNKNOWN_ERROR', flag = null) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errorCode = errorCode;
        this.flag = flag;
    }
}

module.exports = AppError;
