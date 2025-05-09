const UserModel = require("../models/UserModels")
const appAssert = require("../utils/AppAssert");
const AppErrorCode = require("../utils/AppErrorCode");
const http = require("../utils/http");
const bcrypt = require("bcryptjs");
const OtpModel = require("../models/otpModel");
const { generateOTP, sendMail } = require("../utils/sendMail");
const { generateOtpExpiration, oneYearFromNow } = require("../utils/dates");
const { getVerifyEmailTemplates } = require("../utils/emialTemplates");
const SessionModel = require("../models/sessionModel");
const { signToken, refreshTokenSignOptions } = require("../utils/jwt");

const userRegistrationUseCase = async (userData) => {
    console.log("User Data from the userusecase :", userData)
    const existingUser = await UserModel.userCollection.findOne({
        email: userData.email
    })
    console.log("Existing User : ", existingUser)
    appAssert(
        !existingUser,
        http.CONFLICT,
        "Email already in use",
        AppErrorCode.EmailAlreadyExists,
        { userSignUp: true }
    )
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = await UserModel.userCollection.create({
        fname: userData.fname,
        lname: userData.lname,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
    });
    appAssert(
        newUser,
        http.INTERNAL_SERVER_ERROR,
        "Error in creating an account. Please try it again later.",
        { userSignUp: true }
    );
    const newOtp = await OtpModel.otpCollection.create({
        otp: generateOTP(),
        //TODO: change to email to userId
        otpId: newUser.email,
        generatedAt: Date.now(),
        expireAt: generateOtpExpiration()
    });
    appAssert(
        newOtp,
        http.INTERNAL_SERVER_ERROR,
        'Failed to send OTP. Please try again later.',
        { userSignUp: true }
    );
    await sendMail({
        to: newUser.email,
        ...getVerifyEmailTemplates(newOtp.otp, newUser.name)
    });
    const newSession = await SessionModel.sessionCollection.create({
        userId: newUser._id,
        expriesAt: oneYearFromNow()
    });
    const sessionInfo = {
        sessionId: newSession._id ?? new mongoose.Types.ObjectId(),
        //TODO: impliment role based authentication
    };
    const accessToken = signToken({
        ...sessionInfo,
        userId: newUser._id,
    });
    const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);

    return {
        user: newUser,
        accessToken,
        refreshToken,
    };

}


const userLoginUseCase = async (userData) => {
    console.log("User Data from the userusecase :", userData);
    const existingUser = await UserModel.userCollection.findOne({
        email: userData.email
    });
    appAssert(
        existingUser,
        http.NOT_FOUND,
        "Invalid email or Password",
        { userLogin: true }
    );
    appAssert(
        existingUser.isBlocked,
        http.CONFLICT,
        AppErrorCode.AccountSuspended,
        "User Account is suspended please contact our team.",
        { userLogin: true }
    );
    appAssert(
        existingUser.password,
        http.BAD_REQUEST,
        "Please try with Google",
        { userLogin: true }
    );
    const isPasswordMatch = await bcrypt.compare(
        userData.password,
        existingUser.password
    );
    appAssert(
        isPasswordMatch,
        http.BAD_REQUEST,
        "Incorrect email or password",
        { userLogin: true }
    );
    const newSession = await SessionModel.sessionCollection.create({
        userId: existingUser._id,
        expriesAt: oneYearFromNow()
    });
    const sessionInfo = {
        sessionId: newSession._id ?? new mongoose.Types.ObjectId(),
        //TODO: impliment role based authentication
    };
    const accessToken = signToken({
        ...sessionInfo,
        userId: existingUser._id,
    });
    const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);

    return {
        user: existingUser,
        accessToken,
        refreshToken,
    };

}


module.exports = {
    userRegistrationUseCase,
    userLoginUseCase

}