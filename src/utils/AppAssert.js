const AppError = require("./AppError");
const assert = require("node:assert");

const appAssert = (condition, httpStatusCode, message, appErrorCode = 'UNKNOWN_ERROR', flag = null) => {
    assert(condition, new AppError(httpStatusCode, message, appErrorCode, flag));
};

module.exports = appAssert;
