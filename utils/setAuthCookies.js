const { fifteenMinutesFromNow, thirtyDaysFromNow } = require("./dates");
const { NODE_ENV } = require("./env");


const secure = NODE_ENV === "production";

const REFRESH_PATH = "/api/auth/refresh";

const defaults = {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "strict",
    domain: secure ? "h-furniture.nandhu.live" : undefined,
};

const getAccessTokenCookieOptions = () => ({
    ...defaults,
    expires: fifteenMinutesFromNow(),
});

const generateRefreshTokenCookieOptions = () => ({
    ...defaults,
    expires: thirtyDaysFromNow(),
    path: REFRESH_PATH,
});

const setAuthCookies = ({ res, accessToken, refreshToken }) => {
    return res
        .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
        .cookie("refreshToken", refreshToken, generateRefreshTokenCookieOptions());
};

const clearAuthCookies = (res) =>
    res.clearCookie("accessToken").clearCookie("refreshToken", {
        path: REFRESH_PATH,
    });

const getTempAccessTokenCookieOptions = () => ({
    ...defaults,
    expires: fifteenMinutesFromNow(),
});

const setTempAuthCookies = ({ res, accessToken }) => {
    return res.cookie("accessToken", accessToken, getTempAccessTokenCookieOptions());
};

const clearTempAuthCookies = (res) => res.clearCookie("accessToken");

module.exports = {
    REFRESH_PATH,
    getAccessTokenCookieOptions,
    generateRefreshTokenCookieOptions,
    setAuthCookies,
    clearAuthCookies,
    setTempAuthCookies,
    clearTempAuthCookies,
};
