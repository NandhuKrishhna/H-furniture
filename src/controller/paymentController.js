
const instance = require("../config/razorpay");
const { addressCollection } = require("../models/addressModel");
const { cartCollection } = require("../models/cartModel");
const { orderCollection } = require("../models/orderModel");
const { productCollection } = require("../models/productModels");
const { userCollection } = require("../models/UserModels");
const { walletCollection } = require("../models/walletModel");
const { OK, BAD_REQUEST, NOT_FOUND } = require("../utils/http");
const verifyToken = require("../utils/verifyToken");
const crypto = require("crypto");

module.exports = {
    handlePaymentFailure: async (order_id, payment_id) => {
        try {
            const result = await orderCollection.updateOne(
                { razorpayOrderId: order_id },
                { $set: { paymentStatus: 'Pending', paymentId: payment_id }, $setOnInsert: { updatedAt: new Date() } },
                { upsert: true }
            );
            console.log('Update result:', result);
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    },
    getPaymentMethod: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id;

            const cartDetails = await cartCollection.findOne({ userId: userId }).lean();
            const appliedCoupon = cartDetails.appliedCoupon;
            console.log(appliedCoupon, "appliedCoupon");
            res.status(OK).render("user/paymentMethod", {
                userId,
                user: true,
                cart: cartDetails,
                appliedCoupon
            })



        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    paymentMethod: async (req, res, next) => {
        try {
            console.log(req.body);
            const { paymentMethod, couponCode } = req.body;
            console.log("couponCode", couponCode);

            if (!paymentMethod) {
                console.error('Payment method is missing');
                return res.status(BAD_REQUEST).send('Payment method is required');
            }

            const user = verifyToken(req);
            const userId = user._id;
            const userInfo = await userCollection.findById(userId);
            const cart = await cartCollection.findOne({ userId: userId });
            const address = await addressCollection.findOne({ userId: userId, isDeleted: false });
            console.log("This is cart details from payment method", cart);

            if (paymentMethod === 'COD' && cart.finalAmount > 5000) {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: 'Cash on Delivery is not available for orders above ₹5000. Please choose another payment method.',
                });
            }

            if (paymentMethod === 'Razorpay') {
                const razorpayOrder = await instance.orders.create({
                    amount: cart.finalAmount * 100,
                    currency: 'INR',
                    receipt: uuidv4()
                });
                console.log(razorpayOrder, 'razorpayOrder');
                const newOrderItems = cart.products.map(product => ({
                    productId: product.productId,
                    quantity: product.quantity,
                    price: product.price,
                    name: product.productName,
                    image: product.image,
                    transactionId: uuidv4(),
                    appliedCoupon: cart.appliedCoupon,

                }));

                const newOrder = new orderCollection({
                    userId: userId,
                    orderItems: newOrderItems,
                    shippingAddress: req.session.selectedAddress || address,
                    billingAddress: req.session.selectedAddress || address,
                    totalAmount: cart.finalAmount,
                    discountValue: cart.discountValue,
                    orderDate: new Date(),
                    orderStatus: 'Order Placed',
                    paymentStatus: 'Pending',
                    paymentMethod,
                    razorpayOrderId: razorpayOrder.id,
                    orderId: uuidv4()
                });

                await newOrder.save();
                console.log(razorpayOrder, 'razorpayOrder');
                console.log(razorpayOrder.id, 'razorpayOrder.id');
                //  ------reducing the product quantity---------
                for (const product of cart.products) {
                    await productCollection.updateOne(
                        { _id: product.productId },
                        { $inc: { quantity: -product.quantity, purchaseCount: product.quantity } }
                    );
                }
                // >>>>>>clearing the cart<<<<<<<<
                await cartCollection.updateOne(
                    { userId },
                    { $set: { products: [], totalAmount: 0, finalAmount: 0, discountValue: 0 }, appliedCoupon: null }
                );

                return res.json({
                    success: true,
                    orderId: razorpayOrder.id,
                    currency: razorpayOrder.currency,
                    amount: razorpayOrder.amount
                });

            } else if (paymentMethod === 'COD') {
                const newOrderItems = cart.products.map(product => ({
                    productId: product.productId,
                    quantity: product.quantity,
                    price: product.price,
                    name: product.productName,
                    image: product.image,
                    transactionId: uuidv4(),
                    appliedCoupon: couponCode,

                }));

                const newOrder = new orderCollection({
                    userId: userId,
                    orderItems: newOrderItems,
                    shippingAddress: req.session.selectedAddress || address,
                    billingAddress: req.session.selectedAddress || address,
                    totalAmount: cart.finalAmount,
                    discountValue: cart.discountValue,
                    orderDate: new Date(),
                    orderStatus: 'Order Placed',
                    paymentStatus: 'Pending',
                    paymentMethod,

                });

                await newOrder.save();

                for (const product of cart.products) {
                    await productCollection.updateOne(
                        { _id: product.productId },
                        { $inc: { quantity: -product.quantity, purchaseCount: product.quantity } }
                    );
                }

                await cartCollection.updateOne(
                    { userId },
                    { $set: { products: [], totalAmount: 0, finalAmount: 0, discountValue: 0 } }
                );

                return res.redirect(`/user/orders`);
            } else {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid payment method',
                })
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            next(error);
        }
    },
    paymentVerification: async (req, res, next) => {
        try {
            const { payment_id, order_id, signature } = req.body;
            console.log("paymentId : ", payment_id);
            console.log("orderId : ", order_id);
            console.log("signature : ", signature);
            const user = verifyToken(req);
            const userId = user._id;
            console.log("userId from payment verification : ", userId);
            // console.log("userEmail from payment verification : ", userEmail);

            const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(order_id + '|' + payment_id)
                .digest('hex');

            if (generatedSignature !== signature) {
                console.log('----Signature mismatch----');
                await this.handlePaymentFailure(order_id, payment_id);
                await orderCollection.updateOne(
                    { razorpayOrderId: order_id },
                    { $set: { paymentStatus: 'Failed', paymentId: payment_id } }
                )
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: 'Payment verification failed'
                });
            }

            const payment = await instance.payments.fetch(payment_id);
            console.log("Fetched Payment Details: ", payment);


            if (payment.status !== 'success' && payment.status !== 'captured') {
                console.log("Non-success Payment Status: ", payment.status);
                await handlePaymentFailure(order_id, payment_id);
                return res.redirect(`/user/orders`);
            }


            console.log('Payment successful');
            const result = await orderCollection.updateOne(
                { razorpayOrderId: order_id },
                { $set: { paymentStatus: 'Success', paymentId: payment_id } }
            );

            console.log('Update result:', result);
            res.redirect(`/user/orders`);

        } catch (error) {
            console.error('Error verifying payment:', error);
            next(error);
        }
    },
    getMyOrders: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id;
            const userInfo = await userCollection.findById(userId);
            const orders = await orderCollection.find({ userId: userId }).sort({ updatedAt: -1 }).lean();

            res.status(OK).render("user/orders", {
                user: true,
                userId,
                orders,
                userInfo
            })


        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    cancelOrderItem: async (req, res, next) => {
        try {
            const { orderId, itemId } = req.params;
            console.log(req.params);

            const order = await orderCollection.findOne({ _id: orderId });

            const item = order.orderItems.id(itemId);
            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
            }

            item.status = 'Cancelled';
            await order.save();

            const allCancelled = order.orderItems.every(item => item.status === 'Cancelled');
            if (allCancelled) {
                order.orderStatus = 'Cancelled';
                await order.save();
            }


            if (order.paymentMethod === "Razorpay") {
                const userId = order.userId;
                const refundAmount = item.price;
                const wallet = await walletCollection.findOne({ userId });

                if (wallet) {
                    wallet.balance += refundAmount;
                    wallet.history.push({
                        transactionType: "Refunded",
                        amount: refundAmount,
                        date: new Date()
                    });
                    await wallet.save();
                } else {
                    const newWallet = new walletCollection({
                        userId,
                        balance: refundAmount,
                        history: [{
                            transactionType: 'Refunded',
                            amount: refundAmount,
                            date: new Date()
                        }]
                    });
                    await newWallet.save();
                }
            }

            res.json({
                success: true,
                message: 'Item has been cancelled successfully'
            });
        } catch (error) {
            console.error('Error cancelling order item:', error);
            next(error);
        }
    },
    getOrderDetails: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userInfo = await userCollection.findById(user._id);
            const { orderId, itemId } = req.params;

            const order = await orderCollection.findById(orderId).populate("orderItems.productId");
            const item = order.orderItems.find(item => item._id.toString() === itemId);

            const product = await productCollection
                .findById(item.productId._id)
                .populate({
                    path: 'reviews.user',
                    select: 'firstName lastName'
                });


            res.status(OK).render("user/orderDetails", {
                order,
                item,
                user: true,
                updatedAt: order.updatedAt,
                userInfo,
                product,
                reviews: product.reviews,
                averageRating: product.averageRating,
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    },
    returnProduct: async (req, res, next) => {
        try {
            const { orderId, itemId, reason } = req.body;
            console.log(req.body);

            const order = await orderCollection.findOneAndUpdate(
                { _id: orderId, "orderItems._id": itemId },
                {
                    $set: {
                        "orderItems.$.status": 'Return Requested',
                        "orderItems.$.returnRequest.reason": reason,
                        "orderItems.$.returnRequest.status": 'Pending',
                        "orderItems.$.returnRequest.requestDate": new Date(),
                    }
                },
                { new: true }
            )
            if (!order) {
                return res.status(NOT_FOUND).json({
                    success: false,
                    message: 'Order or product not found'
                });
            }

            res.status(OK).json({
                success: false,
                message: 'Return request submitted successfully', order
            });

        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    addReview: async (req, res, next) => {
        try {
            const { rating, comment } = req.body;
            const productId = req.params.id;
            const userId = req.user._id;
            console.log(userId, productId, rating, comment);

            const newReview = {
                user: userId,
                rating: parseInt(rating),
                comment: comment,
                date: new Date(),
            };


            const product = await productCollection.findById(productId);
            if (!product) {
                return res.status(NOT_FOUND).json({ message: 'Product not found' });
            }


            product.reviews.push(newReview);

            product.averageRating =
                product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
            await product.save();

            res.status(OK).json({
                message: 'Review added successfully', product
            });
        } catch (err) {
            console.error(err);
            next(error)
        }
    },
    repayAmount: async function (req, res, next) {
        try {
            const user = verifyToken(req);
            const userId = user._id;
            const orderId = req.params.orderId;
            const orderDetails = await orderCollection.findById(orderId);
            const totalAmount = orderDetails.orderItems.reduce((sum, item) => {
                return sum + item.price;
            }, 0);
            res.status(OK).render("user/re-payNow", {
                success: true,
                order: orderDetails,
                totalAmount,
                userId,
                user: true
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    },

    repaymentMethod: async function (req, res, next) {
        try {
            const { paymentMethod, totalAmount } = req.body;
            const user = verifyToken(req);
            const userId = user._id;

            const order = await orderCollection.findOne({ userId: userId, paymentStatus: 'Pending' });

            if (!order) {
                return res.status(NOT_FOUND).json({ success: false, message: 'Order not found' });
            }

            if (paymentMethod === 'Razorpay') {
                const razorpayOrder = await instance.orders.create({
                    amount: totalAmount * 100,
                    currency: 'INR',
                    receipt: uuidv4()
                });

                await orderCollection.updateOne(
                    { _id: order._id },
                    { $set: { razorpayOrderId: razorpayOrder.id, paymentStatus: 'Pending', paymentMethod: 'Razorpay' } }
                );

                return res.json({
                    success: true,
                    orderId: razorpayOrder.id,
                    currency: razorpayOrder.currency,
                    amount: razorpayOrder.amount
                });

            } else if (paymentMethod === 'COD') {
                await orderCollection.updateOne(
                    { _id: order._id },
                    { $set: { paymentStatus: 'Pending', paymentMethod: 'COD' } }
                );

                return res.json({ success: true });
            } else {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid payment method',
                });
            }
        } catch (error) {
            console.error('Error processing repayment:', error);
            next(error);
        }
    },

    repaymentVerification: async function (req, res, next) {
        const { payment_id, order_id, signature } = req.body;
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${order_id}|${payment_id}`)
            .digest('hex');

        if (generatedSignature !== signature) {
            await orderCollection.updateOne(
                { razorpayOrderId: order_id },
                { $set: { paymentStatus: 'Failed', paymentId: payment_id } }
            );
            return res.status(BAD_REQUEST).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        try {
            const payment = await instance.payments.fetch(payment_id);

            if (payment.status === 'failed') {
                await Orderdb.orderCollection.updateOne(
                    { razorpayOrderId: order_id },
                    { $set: { paymentStatus: 'Failed', paymentId: payment_id } }
                );
                return res.redirect(`/user/orders`);
            }

            await orderCollection.updateOne(
                { razorpayOrderId: order_id },
                { $set: { paymentStatus: 'Success', paymentId: payment_id } }
            );
            res.redirect(`/user/orders`);
        } catch (error) {
            console.error('Error verifying payment:', error);
            next(error);
        }
    },
}