const express = require("express")
const authRouter = express.Router();
const authController = require("../controller/authController");
const { signupValidationRules, validate, validateOtp, validateLoginRules } = require("../utils/errorhandling");
const passport = require("passport");

authRouter.get("/user/signup", authController.getUserSignup);
authRouter.post("/user/signup", signupValidationRules, validate, authController.userRegistration);
authRouter.get("/user/submit_otp", authController.getsubmitSignupotp);
authRouter.post("/user/submit_otp", validateOtp, validate, authController.submitSignupotp);
authRouter.post("/user/resend_otp", authController.resendSignUpOtp);

// user login
authRouter.get("/user/login", authController.getUserLogin);
authRouter.post("/user/login", validateLoginRules, validate, authController.userSignin);

//user forgot password
authRouter.get("/user/forgot-password", authController.enterForgotEmail);
authRouter.post("/user/forgot-password", authController.submitEmailForOtp);

// otp and resend otp for forgot password
authRouter.get("/user/forgot_otp", authController.getEnterForgotOtp);
authRouter.post("/user/forgot_otp", authController.submitForgetOtp);
authRouter.post("/user/resend_forgot_otp", validateOtp, validate, authController.resendForgortPass);

//changing the password 
authRouter.get("/user/change_password", authController.getChangePassword);
authRouter.post("/user/change_password", authController.changePassword);


authRouter.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRouter.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/user/signup", session: false }), (req, res) => {
    const { user, token } = req.user;
    if (token) {
        res.cookie("token", token, {
            httpOnly: true,
        });
        res.redirect("/");
    } else {
        res.redirect("/user/login");
    }
});

authRouter.post("/user/logout", authController.userLogout)


module.exports = authRouter