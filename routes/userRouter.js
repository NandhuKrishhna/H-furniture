const express = require("express")
const router = express.Router();
const userController = require("../controller/userController")
const passport = require("passport");
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
const {isUserAuthenticated} = require("../middleware/userAuth");
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
router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/user/signup", session: false }), (req, res) => {
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

//----------------------
//---------user homepage
// router.get("/", userController.userHomePage)
//---------user products-----------------
router.get("/user/products",userController.getUserProducts)
router.get("/user/search",userController.getUserProducts) // for serach

//---------user products details-------------
router.get("/user/product/:id", userController.getProductDetails);


//---------cart routes-----------
router.get("/user/cart", isUserAuthenticated, userController.getCart )
router.post("/user/add-to-cart", isUserAuthenticated, userController.addToCart)
router.patch("/user/update-cart",isUserAuthenticated, userController.updateCart);
router.delete("/user/delete-from-cart", isUserAuthenticated, userController.removeFromCart);
//---------apply coupon-------
router.post("/user/apply-coupon",isUserAuthenticated, userController.applyCoupon);
router.post("/user/remove-coupon",isUserAuthenticated, userController.removeCoupon);

router.route("/user/checkout_address_details")
.get(isUserAuthenticated,userController.checkout)
.post(isUserAuthenticated,userController.checkout)


// my accound details--------
router.route("/user/my-account")
.get(isUserAuthenticated,userController.getMyAccount)
.post(isUserAuthenticated,userController.postMyAccount)

// getting my address details page
router.get("/user/my-address",isUserAuthenticated,  userController.getMyAddress)
// getting add address , edit , delete----------

router.route("/user/add_address")
.get(isUserAuthenticated,userController.getAddMyAddress)
.post(isUserAuthenticated,validateAddress,validate,userController.addMyAddress)


//-------edit address
router.get("/user/edit_address/:id",isUserAuthenticated,userController.getEditMyAddress)
router.put("/user/edit_address/:id",isUserAuthenticated,validateAddress,validate,userController.editMyAddress)



router.delete("/user/delete_address/:id",isUserAuthenticated, userController.deleteAddress);


//-----set new password-------
router.route("/user/set_new_password")
.get(isUserAuthenticated,userController.getSetNewPassword)
.post(isUserAuthenticated,validateChangePass,validate,  userController.setNewPassword)

router.route("/user/payment_method")
.get(isUserAuthenticated,userController.getPaymentMethod)
.post(isUserAuthenticated,userController.paymentMethod)
router.post("/user/payment_callback",isUserAuthenticated, userController.paymentVerification)

//-----get order page---------
router.get("/user/orders",isUserAuthenticated,userController.getMyOrders)

router.post('/order/:orderId/item/:itemId/cancel',isUserAuthenticated, userController.cancelOrderItem);
router.get('/order/:orderId/item/:itemId',isUserAuthenticated, userController.getOrderDetails)
router.post("/order/return", userController.returnProduct)


router.get("/user/re-order/:orderId",isUserAuthenticated, userController.repayAmount); 
router.post("/user/repayment_method", isUserAuthenticated,userController.repaymentMethod);
router.post("/user/repayment_callback",isUserAuthenticated, userController.repaymentVerification);

//-----invoice------
router.get("/download-invoice/:orderId",isUserAuthenticated, userController.getInvoice);

//-----coupon page
router.get("/user/coupons",isUserAuthenticated, userController.getAddCouponPage)

router.get("/user/wishlist",isUserAuthenticated, userController.getWishList)
router.post("/user/addwishlist",isUserAuthenticated,userController.addToWishList)
router.post("/user/remove-wishlist",isUserAuthenticated,userController.removeFromWishList)
//-----get wallet-------->
router.get("/user/wallet",isUserAuthenticated, userController.getWallet)
router.post("/user/wallet",isUserAuthenticated, userController.addMoneyToWallet)


router.post("/user/logout", userController.userLogout)
// router.get("/sample", userController.addReview)
router.get("/", userController.homepage)

module.exports = router