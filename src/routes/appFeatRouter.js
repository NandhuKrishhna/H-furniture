const express = require("express")
const appFeatRouter = express.Router();
const appFeatController = require("../controller/appFeatController");
const { isUserAuthenticated } = require("../middleware/userAuth");

appFeatRouter.post("/user/apply-coupon", isUserAuthenticated, appFeatController.applyCoupon);
appFeatRouter.post("/user/remove-coupon", isUserAuthenticated, appFeatController.removeCoupon);
appFeatRouter.route("/user/checkout_address_details")
    .get(isUserAuthenticated, appFeatController.checkout)
    .post(isUserAuthenticated, appFeatController.checkout)
appFeatRouter.get("/download-invoice/:orderId", isUserAuthenticated, appFeatController.getInvoice);

appFeatRouter.get("/user/coupons", isUserAuthenticated, appFeatController.getAddCouponPage)

appFeatRouter.get("/user/wishlist", isUserAuthenticated, appFeatController.getWishList)
appFeatRouter.post("/user/addwishlist", isUserAuthenticated, appFeatController.addToWishList)
appFeatRouter.post("/user/remove-wishlist", isUserAuthenticated, appFeatController.removeFromWishList)
appFeatRouter.get("/user/wallet", isUserAuthenticated, appFeatController.getWallet)
appFeatRouter.post("/user/wallet", isUserAuthenticated, appFeatController.addMoneyToWallet)

module.exports = appFeatRouter