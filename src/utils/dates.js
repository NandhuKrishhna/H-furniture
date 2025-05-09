const oneYearFromNow = () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

const thirtyDaysFromNow = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

const fifteenMinutesFromNow = () => new Date(Date.now() + 15 * 60 * 1000);

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const fiveMinutesAgo = () => new Date(Date.now() - 5 * 60 * 1000);

const oneHourFromNow = () => new Date(Date.now() + 60 * 60 * 1000);

const generateOtpExpiration = () => new Date(Date.now() + 5 * 60 * 1000);

const convertToIST = (dateTime) => {
    return new Date(new Date(dateTime).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

const convertToISTWithOffset = (dateTime, offsetHours = 0) => {
    const istDate = convertToIST(dateTime);
    return new Date(istDate.getTime() + offsetHours * 60 * 60 * 1000);
};

module.exports = {
    oneHourFromNow,
    convertToISTWithOffset,
    generateOtpExpiration,
    fiveMinutesAgo,
    ONE_DAY_MS,
    fifteenMinutesFromNow,
    thirtyDaysFromNow,
    oneYearFromNow
}
