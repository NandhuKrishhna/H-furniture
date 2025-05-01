const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_REFRESH_SECRET } = require("./env");


const defaults = { audience: ["user"] };

const accessTokenOptions = { expiresIn: "15m", secret: JWT_SECRET };
const refreshTokenSignOptions = { expiresIn: "30d", secret: JWT_REFRESH_SECRET };
const resetTokenOptions = { expiresIn: "10m", secret: JWT_SECRET };

const signToken = (payload, options = accessTokenOptions) => {
    const { secret, ...signOpts } = options;
    return jwt.sign(payload, secret, { ...defaults, ...signOpts });
};

const verfiyToken = (token, options = {}) => {
    const { secret = JWT_SECRET, ...verifyOpts } = options;
    try {
        const payload = jwt.verify(token, secret, { ...defaults, ...verifyOpts });
        return { payload };
    } catch (error) {
        return { error: error.message };
    }
};

const signResetToken = (payload) => {
    const { secret, ...signOpts } = resetTokenOptions;
    return jwt.sign(payload, secret, { ...defaults, ...signOpts });
};

const verifyResetToken = (token) => {
    const { secret, ...verifyOpts } = resetTokenOptions;
    try {
        const payload = jwt.verify(token, secret, { ...defaults, ...verifyOpts });
        return { payload };
    } catch (error) {
        return { error: error.message };
    }
};

module.exports = {
    accessTokenOptions,
    refreshTokenSignOptions,
    resetTokenOptions,
    signToken,
    verfiyToken,
    signResetToken,
    verifyResetToken,
};
