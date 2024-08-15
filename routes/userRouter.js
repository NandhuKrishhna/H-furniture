const express = require("express")
const router = express.Router();
const userController = require("../controller/userController")
const passport = require("passport");
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
const auth = require("../middleware/userAuth");
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
router.get("/user/forgot-password",userController.enterForgotEmail);
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
//---------user homepage
router.get("/", userController.userHomePage)
//---------user products-----------------
router.get("/user/products",userController.getUserProducts)
router.get("/user/search",userController.getUserProducts) // for serach

//---------user products details-------------
router.get("/user/product/:id", userController.getProductDetails);


//---------cart routes-----------
router.get("/user/cart", userController.getCart )
router.post("/user/add-to-cart", userController.addToCart)
router.patch("/user/update-cart", userController.updateCart);
router.delete("/user/delete-from-cart", userController.removeFromCart);
//---------apply coupon-------
router.post("/user/apply-coupon", userController.applyCoupon);
router.post("/user/remove-coupon", userController.removeCoupon);

router.route("/user/checkout_address_details")
.get(auth.isUserAuthenticated,userController.checkout)
.post(auth.isUserAuthenticated,userController.checkout)


// my accound details--------
router.route("/user/my-account")
.get(userController.getMyAccount)
.post(userController.postMyAccount)

// getting my address details page
router.get("/user/my-address",  userController.getMyAddress)
// getting add address , edit , delete----------

router.route("/user/add_address")
.get(userController.getAddMyAddress)
.post(validateAddress,validate,userController.addMyAddress)


//-------edit address
router.get("/user/edit_address/:id",userController.getEditMyAddress)
router.post("/user/edit_address/:id",userController.editMyAddress)



router.delete("/user/delete_address/:id", userController.deleteAddress);


// set new password
router.route("/user/set_new_password")
.get(userController.getSetNewPassword)
.post(validateChangePass,validate,  userController.setNewPassword)

router.route("/user/payment_method")
.get(userController.getPaymentMethod)
.post(userController.paymentMethod)
router.post("/user/payment_callback", userController.paymentVerification)
router.get("/user/orders",userController.getMyOrders)

router.post('/order/:orderId/item/:itemId/cancel', userController.cancelOrderItem);
router.get("/order/details/:orderId/:itemId", userController.orderDetails)


//-----coupon page
router.get("/user/coupons", userController.getAddCouponPage)

router.get("/user/wishlist", userController.getWishList)
router.post("/user/addwishlist",userController.addToWishList)
router.post("/user/remove-wishlist",userController.removeFromWishList)
//-----get wallet-------->
router.get("/user/wallet", userController.getWallet)
router.post("/user/wallet", userController.addMoneyToWallet)


router.post("/user/logout", userController.userLogout)



module.exports = router