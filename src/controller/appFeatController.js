const instance = require("../config/razorpay");
const { addressCollection } = require("../models/addressModel");
const { cartCollection } = require("../models/cartModel");
const { couponCollection } = require("../models/couponModel");
const { orderCollection } = require("../models/orderModel");
const { productCollection } = require("../models/productModels");
const { userCollection } = require("../models/UserModels");
const { walletCollection } = require("../models/walletModel");
const { wishListCollection } = require("../models/wishListModel");
const { BAD_REQUEST, OK, NOT_FOUND, INTERNAL_SERVER_ERROR } = require("../utils/http");
const verifyToken = require("../utils/verifyToken");

module.exports = {
    applyCoupon: async (req, res, next) => {
        try {
            const userInfo = verifyToken(req);
            const userId = new ObjectId(userInfo._id);
            const { couponCode } = req.body;
            console.log("couponCode", couponCode);

            const coupon = await couponCollection.findOne({
                code: couponCode,
                isActive: true,
                isDeleted: false
            });

            if (!coupon) {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid or expired coupon code'
                });
            }

            const cart = await cartCollection.findOne({ userId: userId });

            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            const totalAmount = cart.products.reduce((total, product) => {
                return total + product.price;
            }, 0);

            let discount = coupon.discountType === 'fixed'
                ? coupon.discountValue
                : (totalAmount * coupon.discountValue) / 100;

            discount = coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;

            const finalAmount = totalAmount - discount;

            await cartCollection.updateOne(
                { userId: userId },
                {
                    $set: {
                        totalAmount: totalAmount,
                        appliedCoupon: coupon._id,
                        discountValue: discount,
                        finalAmount: finalAmount
                    }
                }
            );

            res.status(OK).json({
                success: true,
                message: 'Coupon applied successfully',
                finalAmount,
                discountValue: discount
            });
        } catch (error) {
            console.error('Error applying coupon:', error);
            next(error);
        }
    },
    removeCoupon: async (req, res, next) => {
        try {
            const userInfo = verifyToken(req);
            const userId = userInfo._id;

            const cart = await cartCollection.findOne({ userId: userId });
            if (!cart) {
                return res.status(NOT_FOUND).json({
                    success: false,
                    message: 'Cart not found'
                });
            }

            let totalAmount = cart.products.reduce((sum, item) => {
                return sum + item.price;
            }, 0);

            console.log('Total Amount Calculated:', totalAmount);
            console.log('Cart Before Update:', cart);

            const updateResult = await cartCollection.updateOne(
                { userId: userId },
                {
                    $unset: { appliedCoupon: "", discountValue: "" },
                    $set: { finalAmount: totalAmount }
                }
            );

            if (cart.appliedCoupon) {
                await Coupondb.couponCollection.updateOne(
                    { _id: cart.appliedCoupon },
                    { $inc: { usedCount: -1 } }
                );
            }

            res.status(OK).json({
                success: true,
                totalAmount: totalAmount,
                finalAmount: totalAmount,
                discountValue: 0
            });
        } catch (error) {
            console.log('Error:', error);
            next(error);
        }
    },
    checkout: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id;
            const cartDetails = await cartCollection.findOne({ userId: userId });
            const userInfo = await userCollection.findById(userId);
            const hadAddress = userInfo.address ? 'true' : 'false';
            const currentUrl = req.originalUrl;
            // If the user is blocked
            if (userInfo.isBlocked) {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: "User access is denied"
                });
            }

            const address = await addressCollection.find({ userId, isDeleted: false });

            if (req.method === 'POST' && req.body.selectedAddress) {
                const selectedAddressId = req.body.selectedAddress;
                const selectedAddress = await addressCollection.findOne({ _id: selectedAddressId, userId });

                if (selectedAddress) {
                    req.session.selectedAddress = selectedAddress;
                    return res.status(OK).json({
                        success: true,
                        message: "Address selected successfully"
                    });
                } else {
                    return res.status(BAD_REQUEST).json({ success: false, message: 'Invalid address selection' });
                }
            }

            res.render('user/checkoutAddress', {
                cart: cartDetails,
                hadAddress,
                address,
                user: true,
                userId,
                currentUrl
            });
        } catch (error) {
            console.error("Error getting checkout details:", error);
            next(error);
        }
    },
    handlePaymentFailure: async (order_id, payment_id) => {
        console.error('Payment failed');
        try {
            const result = await orderCollection.updateOne(
                { razorpayOrderId: order_id },
                { $set: { paymentStatus: 'Pending', paymentId: payment_id } }
            );
            console.log('Update result:', result);
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    },
    getAddCouponPage: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id
            const userInfo = await userCollection.findById(userId)
            const coupons = await couponCollection.find({
                isDeleted: false
            });
            res.status(OK).render("user/couponsPage", {
                coupons,
                user: true,
                userInfo
            })
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    getWishList: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id;
            const userInfo = await userCollection.findById(userId);
            const wishlist = await wishListCollection.findOne({ userId: userId });

            let productDetails = [];

            if (wishlist && wishlist.items) {
                const productIds = wishlist.items.map(item => item.productId);

                const products = await productCollection.find({ _id: { $in: productIds } });
                //--------getting product details-------
                for (const product of products) {
                    productDetails.push({
                        _id: product._id,
                        name: product.productName,
                        price: calculateDiscountedPrice(product.originalprice, product.discount),
                        image: product.images[0],
                        discount: product.discount,
                        originalprice: product.originalprice
                    });
                }

                console.log(productDetails, "productDetails");
            } else {
                console.log("Wishlist is empty");
            }
            res.status(OK).render("user/wishlist", {
                wishlist: wishlist || [],
                user: true,
                userInfo,
                productDetails,
            });
        } catch (error) {
            console.error(error);
            next(error);
        }
    },
    addToWishList: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id;
            const { productId } = req.body;


            const userInfo = await userCollection.findById(userId);


            let wishList = await wishListCollection.findOne({ userId });

            if (!wishList) {

                wishList = new wishListCollection({
                    userId,
                    items: [{ productId }]
                });
            } else {

                const itemIndex = wishList.items.findIndex(item => {
                    return item.productId.toString() === productId.toString();
                });

                if (itemIndex === -1) {

                    wishList.items.push({ productId });
                } else {

                    return res.status(BAD_REQUEST).json({
                        success: false,
                        message: "Product is already in the wishlist"
                    });
                }
            }


            await wishList.save();


            res.status(OK).json({
                success: true,
                message: "Product added to wishlist successfully"
            });

        } catch (error) {
            console.error("Error adding product to wishlist:", error);
            next(error);
        }
    },
    removeFromWishList: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id;
            const { productId } = req.body;

            const userInfo = await userCollection.findById(userId);
            let wishList = await wishListCollection.findOne({ userId });
            if (wishList) {
                const itemIndex = wishList.items.findIndex(item => {
                    return item.productId.toString() === productId.toString();
                });

                if (itemIndex !== -1) {
                    wishList.items.splice(itemIndex, 1);

                    await wishList.save();

                    return res.status(OK).json({
                        success: true,
                        message: "Product removed from wishlist successfully"
                    });
                } else {
                    return res.status(BAD_REQUEST).json({
                        success: false,
                        message: "Product not found"
                    });
                }
            } else {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: "Wishlist not found"
                });
            }
        } catch (error) {
            console.log("Error removing product from wishlist:", error);
            next(error);
        }
    },
    getWallet: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id;
            console.log(userId, "this is the user id");

            const wallet = await walletCollection.findOne({ userId: userId });

            if (!wallet) {
                console.log("Wallet not found for user:", userId);
                return res.status(NOT_FOUND).json({
                    success: false,
                    message: 'Wallet not found for the user'
                });
            }

            const userInfo = await userCollection.findById(userId);

            console.log(wallet, "wallet");
            if (wallet) {
                console.log(wallet.balance, "balance");
            }
            // console.log(wallet.history);
            res.status(OK).render("user/wallet", {
                success: true,
                wallet: wallet,
                user: true
            });

        } catch (error) {
            console.log('Error fetching wallet:', error);
            next(error);
        }
    },
    addMoneyToWallet: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id;
            const wallet = await walletCollection.findOne({ userId: user._id });
            const { amount } = req.body;

            const amountInPaise = Math.round(amount * 100);
            let walletBalanceInPaise;

            if (wallet) {

                walletBalanceInPaise = wallet.balance * 100;
                wallet.balance = (walletBalanceInPaise + amountInPaise) / 100;

                wallet.history.push({
                    transactionType: "Deposit",
                    amount: amount,
                    date: new Date(),
                });

                await wallet.save();
            } else {
                const newWallet = new walletCollection({
                    userId,
                    balance: amount,
                    history: [
                        {
                            transactionType: "Deposit",
                            amount: amount,
                            date: new Date(),
                        },
                    ],
                });
                await newWallet.save();
            }
            const options = {
                amount: amountInPaise,
                currency: "INR",
                receipt: uuidv4(),
            };

            const order = await instance.orders.create(options);

            res.status(OK).json({
                success: true,
                message: "Money added to the wallet successfully",
                orderId: order.id,
            });

        } catch (error) {
            console.log(error);
            next(error);
        }
    },
    getInvoice: async (req, res, next) => {
        const { orderId } = req.params;
        try {
            const order = await orderCollection.findById(orderId).exec();

            if (!order) {
                return res.status(404).send('Order not found');
            }
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);

                res.writeHead(200, {
                    'Content-Length': Buffer.byteLength(pdfData),
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment;filename=Invoice_${order._id}.pdf`,
                }).end(pdfData);
            });
            doc.fontSize(20).font('Helvetica-Bold').text('Mazen furniture', 50, 50);
            doc.fontSize(20).text('INVOICE', 50, 50, { align: 'right' });
            doc.moveDown();
            doc.fontSize(10).text(`Invoice No. ${order._id}`, { align: 'right' });
            doc.text(`16 June 2025`, { align: 'right' });
            doc.moveDown();
            doc.fontSize(10).font('Helvetica-Bold').text('BILLED TO:', 50, 150);
            doc.font('Helvetica').text(`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`);
            doc.text(`${order.shippingAddress.phone}`);
            doc.text(`${order.shippingAddress.homeAddress}`);
            doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.pincode}`);
            doc.text(`${order.shippingAddress.country}`);

            doc.moveDown();
            doc.moveDown().lineWidth(1).moveTo(50, 250).lineTo(550, 250).stroke();
            doc.font('Helvetica-Bold').text('Item', 50, 260);
            doc.text('Quantity', 200, 260);
            doc.text('Unit Price', 350, 260);
            doc.text('Total', 500, 260);
            doc.moveDown().lineWidth(1).moveTo(50, 275).lineTo(550, 275).stroke();

            order.orderItems.forEach((item, index) => {
                const y = 280 + (index * 20);
                doc.font('Helvetica').text(`${item.name}`, 50, y);
                doc.text(`${item.quantity}`, 200, y);
                doc.text(`₹${item.price.toFixed(2)}`, 350, y);
                doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, 500, y);
            });
            doc.moveDown().lineWidth(1).moveTo(50, 350).lineTo(550, 350).stroke();
            doc.font('Helvetica-Bold').text('Subtotal', 400, 360);
            doc.text(`₹${order.totalAmount.toFixed(2)}`, 500, 360);
            doc.text('Tax (0%)', 400, 380);
            doc.text(`₹0.00`, 500, 380);
            doc.text('Total', 400, 400);
            doc.text(`₹${order.totalAmount.toFixed(2)}`, 500, 400);
            doc.moveDown();
            doc.text('Thank you!', 50, 450);
            doc.moveDown();
            doc.font('Helvetica').text('');

            doc.text('');
            doc.moveDown();
            doc.end();

        } catch (error) {
            console.error('Error fetching order:', error);
            res.status(INTERNAL_SERVER_ERROR).send('Server error');
        }
    },
}