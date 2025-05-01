
const httpStatusCodes = require("./http.js")
const z = require('zod');
const AppError = require("./AppError.js")

const handleZodError = (res, error) => {
    const errors = error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message,
    }));

    return res.status(httpStatusCodes.BAD_REQUEST).json({
        status: "fail",
        message: "Validation error",
        errors,
        timestamp: new Date().toISOString(),
    });
};

const handleAppError = (res, error) => {
    return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
        errorCode: error.errorCode,
        timestamp: new Date().toISOString(),
    });
};

const errorHandler = (error, req, res, next) => {
    const errorDetails = {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        headers: req.headers,
        error: {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
        },
    };

    console.error("Error Log:", errorDetails);


    if (error instanceof z.ZodError) {
        return handleZodError(res, error);
    }

    if (error instanceof AppError) {
        return handleAppError(res, error);
    }

    res.status(httpStatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Something went wrong. Please try again later.",
        timestamp: new Date().toISOString(),
    });
};

module.exports = errorHandler;
