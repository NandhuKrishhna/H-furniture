const express = require("express")
const paymentRouter = express.Router();
const paymentController = require("../controller/paymentController");
const { isUserAuthenticated } = require("../middleware/userAuth");

paymentRouter.route("/user/payment_method")
    .get(isUserAuthenticated, paymentController.getPaymentMethod)
    .post(isUserAuthenticated, paymentController.paymentMethod)
paymentRouter.post("/user/payment_callback", isUserAuthenticated, paymentController.paymentVerification)
paymentRouter.get("/user/orders", isUserAuthenticated, paymentController.getMyOrders)

paymentRouter.post('/order/:orderId/item/:itemId/cancel', isUserAuthenticated, paymentController.cancelOrderItem);
paymentRouter.get('/order/:orderId/item/:itemId', isUserAuthenticated, paymentController.getOrderDetails)
paymentRouter.post("/order/return", isUserAuthenticated, paymentController.returnProduct)
paymentRouter.post("/user/addReview/:id", isUserAuthenticated, paymentController.addReview)

paymentRouter.get("/user/re-order/:orderId", isUserAuthenticated, paymentController.repayAmount);
paymentRouter.post("/user/repayment_method", isUserAuthenticated, paymentController.repaymentMethod);
paymentRouter.post("/user/repayment_callback", isUserAuthenticated, paymentController.repaymentVerification);


module.exports = paymentRouter;