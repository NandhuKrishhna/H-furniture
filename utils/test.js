const catchErrors = require("./catchError");
const http = require("./http.js");
const { userRegistrationUseCase } = require("./services/userController-service.js");
const { setAuthCookies } = require("./setAuthCookies.js");
const { userRegisterSchema } = require("./zod-validation/user-schema.js");

userRegistration: catchErrors(async (req, res) => {
    const userData = userRegisterSchema.parse({
        ...req.body
    })

    const { user, accessToken, refreshToken, } = await userRegistrationUseCase(userData);
    return setAuthCookies({ res, accessToken, refreshToken })
        .status(http.CREATED)
        .json({
            success: true,
            message: `Registration successfull. An OTP has been sent to ${user.email}`,
            response: { ...user, accessToken },
        });



})

