const express = require("express")
const router = express.Router();
const userController = require("../controller/userController")
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
const { isUserAuthenticated } = require("../middleware/userAuth");
const {

    validate,
    validateChangePass,
    validateAddress,
} = require("../utils/errorhandling");



router.get("/", userController.userHomePage);

router.get("/home", userController.userHomePage)
//---------user products-----------------
router.get("/user/products", userController.getUserProducts)
router.get("/user/search", userController.getUserProducts) // for serach

//---------user products details-------------
router.get("/user/product/:id", userController.getProductDetails);


//---------cart routes-----------
router.get("/user/cart", isUserAuthenticated, userController.getCart)
router.post("/user/add-to-cart", isUserAuthenticated, userController.addToCart)
router.patch("/user/update-cart", isUserAuthenticated, userController.updateCart);
router.delete("/user/delete-from-cart", isUserAuthenticated, userController.removeFromCart);
//---------apply coupon-------
router.post("/user/apply-coupon", isUserAuthenticated, userController.applyCoupon);
router.post("/user/remove-coupon", isUserAuthenticated, userController.removeCoupon);

router.route("/user/checkout_address_details")
    .get(isUserAuthenticated, userController.checkout)
    .post(isUserAuthenticated, userController.checkout)


// my accound details--------
router.route("/user/my-account")
    .get(isUserAuthenticated, userController.getMyAccount)
    .post(isUserAuthenticated, userController.postMyAccount)

// getting my address details page
router.get("/user/my-address", isUserAuthenticated, userController.getMyAddress)
// getting add address , edit , delete----------

router.route("/user/add_address")
    .get(isUserAuthenticated, userController.getAddMyAddress)
    .post(isUserAuthenticated, validateAddress, validate, userController.addMyAddress)


//-------edit address
router.get("/user/edit_address/:id", isUserAuthenticated, userController.getEditMyAddress)
router.put("/user/edit_address/:id", isUserAuthenticated, validateAddress, validate, userController.editMyAddress)



router.delete("/user/delete_address/:id", isUserAuthenticated, userController.deleteAddress);


//-----set new password-------
router.route("/user/set_new_password")
    .get(isUserAuthenticated, userController.getSetNewPassword)
    .post(isUserAuthenticated, validateChangePass, validate, userController.setNewPassword)

router.route("/user/payment_method")
    .get(isUserAuthenticated, userController.getPaymentMethod)
    .post(isUserAuthenticated, userController.paymentMethod)
router.post("/user/payment_callback", isUserAuthenticated, userController.paymentVerification)

//-----get order page---------
router.get("/user/orders", isUserAuthenticated, userController.getMyOrders)

router.post('/order/:orderId/item/:itemId/cancel', isUserAuthenticated, userController.cancelOrderItem);
router.get('/order/:orderId/item/:itemId', isUserAuthenticated, userController.getOrderDetails)
router.post("/order/return", isUserAuthenticated, userController.returnProduct)
router.post("/user/addReview/:id", isUserAuthenticated, userController.addReview)

router.get("/user/re-order/:orderId", isUserAuthenticated, userController.repayAmount);
router.post("/user/repayment_method", isUserAuthenticated, userController.repaymentMethod);
router.post("/user/repayment_callback", isUserAuthenticated, userController.repaymentVerification);

//-----invoice------
router.get("/download-invoice/:orderId", isUserAuthenticated, userController.getInvoice);

//-----coupon page
router.get("/user/coupons", isUserAuthenticated, userController.getAddCouponPage)

router.get("/user/wishlist", isUserAuthenticated, userController.getWishList)
router.post("/user/addwishlist", isUserAuthenticated, userController.addToWishList)
router.post("/user/remove-wishlist", isUserAuthenticated, userController.removeFromWishList)
//-----get wallet-------->
router.get("/user/wallet", isUserAuthenticated, userController.getWallet)
router.post("/user/wallet", isUserAuthenticated, userController.addMoneyToWallet)





module.exports = router