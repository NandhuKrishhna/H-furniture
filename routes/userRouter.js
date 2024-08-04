const express = require("express")
const router = express.Router();
const userController = require("../controller/userController")
const passport = require("passport");
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
const {noToken,isotpAuth,isuserAuthenticated} = require("../middleware/userAuth")
const {  
    
    validateOtp,
    validate,
    signupValidationRules,
    validateLoginRules,
    validateMyAccount,
    validateChangePass,
    validateAddress
} = require("../utils/errorhandling")

// user registration
router.get( "/user/signup",userController.getUserSignup);
router.post("/user/signup",signupValidationRules,validate, userController.userRegistration);
router.get("/user/submit_otp",userController.getsubmitSignupotp);
router.post("/user/submit_otp", validateOtp,validate, userController.submitSignupotp);
router.post("/user/resend_otp", userController.resendSignUpOtp);

// user login
router.get("/user/login", userController.getUserLogin);
router.post("/user/login",validateLoginRules,validate,userController.userSignin);

//user forgot password
router.get("/user/forgot-password",noToken,userController.enterForgotEmail);
router.post("/user/forgot-password", userController.submitEmailForOtp);

// otp and resend otp for forgot password
router.get("/user/forgot_otp", userController.getEnterForgotOtp);
router.post("/user/forgot_otp",  userController.submitForgetOtp);
router.post("/user/resend_forgot_otp", validateOtp,validate, userController.resendForgortPass);

//changing the password 
router.get("/user/change_password", userController.getChangePassword);
router.post("/user/change_password", userController.changePassword);
//getting otp for email verification

// user google login
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/user/signup" }), (req,res)=> {
    res.redirect("/");
});
//------------------------------------------------------------
//user homepage
router.get("/", userController.userHomePage)
//user products-----------------
router.get("/user/products",userController.getUserProducts)
router.get("/user/search",userController.getUserProducts) // for serach

//user products details-------------
router.get("/user/product/:id", userController.getProductDetails);
//cart routes-----------
router.get("/user/cart/:id", userController.getCart )
router.put("/user/cart/:id", userController.addToCart)
router.delete("/user/cart/:id", userController.removeFromCart);



router.post("/user/make_payment/:id", userController.confirmPayment)

// my accound details--------
router.get("/user/my-account",  userController.getMyAccount)
router.post("/user/my-account", userController.postMyAccount)
// getting my address details page
router.get("/user/my-address",  userController.getMyAddress)
// getting add address , edit , delete----------
router.get("/user/add_address",  userController.getAddMyAddress)
router.post("/user/add_address", validateAddress,validate,userController.addMyAddress)
router.get("/user/edit_address/:id",  userController.getEditMyAddress)
router.put("/user/edit_address/:id", userController.editMyAddress)
router.delete("/user/delete_address/:id", userController.deleteAddress);


// set new password
router.get("/user/set_new_password",  userController.getSetNewPassword)
router.post("/user/set_new_password", validateChangePass,validate,  userController.setNewPassword)

router.route("/user/checkout_address_details/:id")
.get(userController.getCheckout)
.post(userController.getCheckout)
router.get("/user/payment_method/:id", userController.getPaymentMethod);
router.post("/user/payment_method/:id", userController.confirmPayment);

router.get("/user/orders/:id", userController.getMyOrders)
router.post('/user/cancel-order', userController.cancelOrder);


// logout
router.post("/user/logout", userController.userLogout)



module.exports = router