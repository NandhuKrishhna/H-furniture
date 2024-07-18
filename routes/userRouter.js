const express = require("express")
const router = express.Router();
const userController = require("../controller/userController")
const auth = require("../middleware/userAuth");
const passport = require("passport");
const {validateOtp,validate,signupValidationRules,validateSignup} = require("../utils/errorhandling")

router.get( "/user/signup",userController.getUserSignup);
router.post("/user/signup",signupValidationRules,validateSignup, userController.userRegistration);

router.get("/user/login", userController.getUserLogin);
router.post("/user/login", userController.userSignin);

router.get("/user/submit_otp",auth.signupAuth,userController.getsubmitSignupotp);

router.post("/user/submit_otp", validateOtp,validate, userController.submitSignupotp);
router.get("/user/resend_otp", userController.resendSignUpOtp);


router.get("/", userController.userHomePage)
router.get("/user/products",userController.getUserProducts)


router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/user/signup" }), (req,res)=> {
    res.redirect("/");
});


router.get("/user/product/:id", userController.getProductDetails);




router.get("/user/logout", userController.userLogout)



module.exports = router