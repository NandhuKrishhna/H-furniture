const express = require("express")
const authRouter = express.Router();
const authController = require("../controller/authController");
const { signupValidationRules, validate, validateOtp, validateLoginRules } = require("../utils/errorhandling");
const passport = require("passport");
const checkNotLoggedIn = require("../middleware/checkNotLoggedIn");

authRouter.get("/user/signup", checkNotLoggedIn, authController.getUserSignup);
authRouter.post("/user/signup", signupValidationRules, validate, authController.userRegistration);
authRouter.get("/user/submit_otp", checkNotLoggedIn, authController.getsubmitSignupotp);
authRouter.post("/user/submit_otp", validateOtp, validate, authController.submitSignupotp);
authRouter.post("/user/resend_otp", authController.resendSignUpOtp);

// user login
authRouter.get("/user/login", checkNotLoggedIn, authController.getUserLogin);
authRouter.post("/user/login", validateLoginRules, validate, authController.userSignin);

//user forgot password
authRouter.get("/user/forgot-password", checkNotLoggedIn, authController.enterForgotEmail);
authRouter.post("/user/forgot-password", authController.submitEmailForOtp);

// otp and resend otp for forgot password
authRouter.get("/user/forgot_otp", checkNotLoggedIn, authController.getEnterForgotOtp);
authRouter.post("/user/forgot_otp", authController.submitForgetOtp);
authRouter.post("/user/resend_forgot_otp", validateOtp, validate, authController.resendForgortPass);

//changing the password 
authRouter.get("/user/change_password", checkNotLoggedIn, authController.getChangePassword);
authRouter.post("/user/change_password", authController.changePassword);


authRouter.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
authRouter.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/user/signup", session: false }), (req, res) => {
    const { user, token } = req.user;
    console.log("User info after google signUP", user)
    if (token) {
        res.cookie("token", token, {
            httpOnly: true,
        });
        res.redirect(`/auth/google/success?name=${encodeURIComponent(user.fname + " " + user.lname)}&email=${user.email}&profilePicture=${user.profilePicture || ""}`);
    } else {
        res.redirect("/user/login");
    }
});

authRouter.post("/user/logout", authController.userLogout);
authRouter.get("/auth/google/success", authController.googleSuccess);



module.exports = authRouter