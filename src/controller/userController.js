const Userdb = require("../models/UserModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Productdb = require("../models/productModels")
const Orderdb = require("../models/orderModel")
const Addressdb = require("../models/addressModel");
const Cartdb = require("../models/cartModel");
const Coupondb = require("../models/couponModel");
const WishListdb = require("../models/wishListModel");
const Walletdb = require("../models/walletModel")
const uuidv4 = require("uuid").v4;
const { ObjectId } = require("mongodb");
const crypto = require("crypto");
const PDFDocument = require('pdfkit');
const { error } = require("console");
const instance = require("../config/razorpay");
const verifyToken = require("../utils/verifyToken");



function calculateDiscountedPrice(originalPrice, discount) {
  return originalPrice - (originalPrice * discount / 100);
}

module.exports = {


  userHomePage: async (req, res, next) => {
    res.render('user/home-page', {
      user: true
    })
  },


  getMyAccount: async (req, res, next) => {
    try {
      const token = req.cookies.token;

      if (token) {
        try {
          const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
          const userInfo = await Userdb.userCollection.findById(decodedToken._id).lean();

          res.status(200).render("user/my-account", {
            user: true,
            userInfo: userInfo
          });
        } catch (error) {

          res.status(200).render("user/my-account", {
            user: true,
            userInfo: null,
            myAccount: true,
          });
        }
      } else {

        res.status(200).render("user/my-account", {
          user: true,
          userInfo: null,
          myAccount: true,

        });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  postMyAccount: async (req, res, next) => {
    const { fname, lname, phone, email } = req.body;
    console.log('Request Body:', req.body); // Log request body

    try {
      const user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      console.log('Decoded User:', user); // Log decoded user info



      if (!fname || !lname || !phone || !email) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
      }
      // Check if the new email already exists
      const emailExists = await Userdb.userCollection.findOne({ email: email });
      if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }

      // Update user information
      await Userdb.userCollection.findByIdAndUpdate(user._id, {
        firstName: fname,
        lastName: lname,
        phone: phone,
        email: email
      });

      // Send success response
      res.status(200).json({
        success: true
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error: 'An error occurred' });
    }
  },

  getMyAddress: async (req, res, next) => {
    try {
      const user = verifyToken(req)
      const userInfo = await Userdb.userCollection.findById(user._id)
      const address = await Addressdb.addressCollection.find({
        userId: user._id,
        isDeleted: false
      })
      res.status(200).render("user/my-address", {
        user: true,
        userInfo,
        address,
      })
      console.log("useraddress", address,);

    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  getAddMyAddress: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userInfo = await Userdb.userCollection.findById(user._id);
      const redirectUrl = req.query.redirect || '/user/my-address';

      res.status(200).render("user/add_my_address", {
        user: true,
        userInfo,
        redirectUrl
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  addMyAddress: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userId = user._id;

      const data = {
        userId: new ObjectId(userId),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        homeAddress: req.body.address,
        landmark: req.body.landmark,
        city: req.body.city,
        street: req.body.street,
        state: req.body.state,
        phone: req.body.phone,
        country: req.body.country,
        pincode: req.body.pincode
      };
      const { redirectUrl } = req.body;
      console.log(data);
      console.log("---------------------------");

      const address = await Addressdb.addressCollection.insertMany(data);
      if (address) {
        res.status(201).json({
          success: true,
          redirectUrl: redirectUrl || '/user/my-address'
        });
      }

    } catch (error) {
      console.log(error);
      next(error);
    }
  },



  // edit address---------------------------------
  getEditMyAddress: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userInfo = await Userdb.userCollection.findById(user._id);
      const addressId = req.params.id;
      const address = await Addressdb.addressCollection.findById(addressId);

      res.status(200).render("user/edit_my_address", {
        user: true,
        address: [address],
        userInfo
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  editMyAddress: async (req, res, next) => {
    try {
      const addressId = req.params.id;
      const updatedAddress = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        homeAddress: req.body.address,
        landmark: req.body.landmark,
        city: req.body.city,
        street: req.body.street,
        state: req.body.state,
        phone: req.body.phone,
        country: req.body.country,
        pincode: req.body.pincode
      };

      const address = await Addressdb.addressCollection.findByIdAndUpdate(
        addressId,
        { $set: updatedAddress },
        { returnDocument: 'after', new: true }
      );

      if (address) {
        res.status(200).redirect("/user/my-address");
      } else {
        res.status(404).send("Address not found");
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  // setting new password
  getSetNewPassword: async (req, res, next) => {
    try {
      const user = verifyToken(req)
      const userInfo = await Userdb.userCollection.findById(user._id);
      res.status(200).render("user/setNewPassword", {
        user: true,
        userInfo,
      });
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  setNewPassword: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userInfo = await Userdb.userCollection.findById(user._id);

      const { currentpassword, newpassword, confirmpassword } = req.body;

      console.log(currentpassword, "currentpassword");


      const isMatch = await bcrypt.compare(currentpassword, userInfo.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          errors: { currentpassword: { msg: "Current password is incorrect" } }
        });
      }


      if (newpassword !== confirmpassword) {
        return res.status(400).json({
          success: false,
          errors: { confirmpassword: { msg: "New password and confirm password should be the same" } }
        });
      }


      const hashedPassword = await bcrypt.hash(newpassword, 10);


      await Userdb.userCollection.findByIdAndUpdate(user._id, { password: hashedPassword });

      return res.status(200).json({
        success: true,
        message: "Password updated successfully"
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  // delete address------------------------------
  deleteAddress: async (req, res, next) => {
    try {
      const addressId = req.params.id;
      await Addressdb.addressCollection.updateOne(
        { _id: addressId },
        { $set: { isDeleted: true } }
      );
      res.status(200).json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "An error occurred while deleting the address" });
      next(error);
    }
  },




  applyCoupon: async (req, res, next) => {
    try {
      const userInfo = verifyToken(req);
      const userId = new ObjectId(userInfo._id);
      const { couponCode } = req.body;
      console.log("couponCode", couponCode);

      const coupon = await Coupondb.couponCollection.findOne({
        code: couponCode,
        isActive: true,
        isDeleted: false
      });

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired coupon code'
        });
      }

      const cart = await Cartdb.cartCollection.findOne({ userId: userId });

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

      await Cartdb.cartCollection.updateOne(
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

      res.status(200).json({
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


  //------remove coupon and update total amount-------
  removeCoupon: async (req, res, next) => {
    try {
      const userInfo = verifyToken(req);
      const userId = userInfo._id;

      const cart = await Cartdb.cartCollection.findOne({ userId: userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
      }

      let totalAmount = cart.products.reduce((sum, item) => {
        return sum + item.price;
      }, 0);

      console.log('Total Amount Calculated:', totalAmount);
      console.log('Cart Before Update:', cart);

      const updateResult = await Cartdb.cartCollection.updateOne(
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

      res.status(200).json({
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

  /////////////////////////

  //------checkout address-------
  checkout: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userId = user._id;
      const cartDetails = await Cartdb.cartCollection.findOne({ userId: userId });
      const userInfo = await Userdb.userCollection.findById(userId);
      const hadAddress = userInfo.address ? 'true' : 'false';
      const currentUrl = req.originalUrl;
      // If the user is blocked
      if (userInfo.isBlocked) {
        return res.status(400).json({
          success: false,
          message: "User access is denied"
        });
      }

      const address = await Addressdb.addressCollection.find({ userId, isDeleted: false });

      if (req.method === 'POST' && req.body.selectedAddress) {
        const selectedAddressId = req.body.selectedAddress;
        const selectedAddress = await Addressdb.addressCollection.findOne({ _id: selectedAddressId, userId });

        if (selectedAddress) {
          req.session.selectedAddress = selectedAddress;
          return res.status(200).json({
            success: true,
            message: "Address selected successfully"
          });
        } else {
          return res.status(400).json({ success: false, message: 'Invalid address selection' });
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


  //--------getting payment method--------
  getPaymentMethod: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userId = user._id;

      const cartDetails = await Cartdb.cartCollection.findOne({ userId: userId }).lean();
      const appliedCoupon = cartDetails.appliedCoupon;
      console.log(appliedCoupon, "appliedCoupon");
      res.status(200).render("user/paymentMethod", {
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

  //--------payment method--------

  paymentMethod: async (req, res, next) => {
    try {
      console.log(req.body);
      const { paymentMethod, couponCode } = req.body;
      console.log("couponCode", couponCode);

      if (!paymentMethod) {
        console.error('Payment method is missing');
        return res.status(400).send('Payment method is required');
      }

      const user = verifyToken(req);
      const userId = user._id;
      const userInfo = await Userdb.userCollection.findById(userId);
      const cart = await Cartdb.cartCollection.findOne({ userId: userId });
      const address = await Addressdb.addressCollection.findOne({ userId: userId, isDeleted: false });
      console.log("This is cart details from payment method", cart);

      if (paymentMethod === 'COD' && cart.finalAmount > 5000) {
        return res.status(400).json({
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

        const newOrder = new Orderdb.orderCollection({
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
          await Productdb.productCollection.updateOne(
            { _id: product.productId },
            { $inc: { quantity: -product.quantity, purchaseCount: product.quantity } }
          );
        }
        // >>>>>>clearing the cart<<<<<<<<
        await Cartdb.cartCollection.updateOne(
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

        const newOrder = new Orderdb.orderCollection({
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
          await Productdb.productCollection.updateOne(
            { _id: product.productId },
            { $inc: { quantity: -product.quantity, purchaseCount: product.quantity } }
          );
        }

        await Cartdb.cartCollection.updateOne(
          { userId },
          { $set: { products: [], totalAmount: 0, finalAmount: 0, discountValue: 0 } }
        );

        return res.redirect(`/user/orders`);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method',
        })
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      next(error);
    }
  },


  handlePaymentFailure: async (order_id, payment_id) => {
    console.error('Payment failed');
    try {
      const result = await Orderdb.orderCollection.updateOne(
        { razorpayOrderId: order_id },
        { $set: { paymentStatus: 'Pending', paymentId: payment_id } }
      );
      console.log('Update result:', result);
    } catch (error) {
      console.error('Error updating payment status:', error);
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
        await Orderdb.orderCollection.updateOne(
          { razorpayOrderId: order_id },
          { $set: { paymentStatus: 'Failed', paymentId: payment_id } }
        )
        return res.status(400).json({
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
      const result = await Orderdb.orderCollection.updateOne(
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
      const userInfo = await Userdb.userCollection.findById(userId);
      const orders = await Orderdb.orderCollection.find({ userId: userId }).sort({ updatedAt: -1 }).lean();

      res.status(200).render("user/orders", {
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

  getOrderDetails: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userInfo = await Userdb.userCollection.findById(user._id);
      const { orderId, itemId } = req.params;

      const order = await Orderdb.orderCollection.findById(orderId).populate("orderItems.productId");
      const item = order.orderItems.find(item => item._id.toString() === itemId);

      const product = await Productdb.productCollection
        .findById(item.productId._id)
        .populate({
          path: 'reviews.user',
          select: 'firstName lastName'
        });


      res.status(200).render("user/orderDetails", {
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


  cancelOrderItem: async (req, res, next) => {
    try {
      const { orderId, itemId } = req.params;
      console.log(req.params);

      const order = await Orderdb.orderCollection.findOne({ _id: orderId });

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
        const wallet = await Walletdb.walletCollection.findOne({ userId });

        if (wallet) {
          wallet.balance += refundAmount;
          wallet.history.push({
            transactionType: "Refunded",
            amount: refundAmount,
            date: new Date()
          });
          await wallet.save();
        } else {
          const newWallet = new Walletdb.walletCollection({
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


  getAddCouponPage: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userId = user._id
      const userInfo = await Userdb.userCollection.findById(userId)
      const coupons = await Coupondb.couponCollection.find({
        isDeleted: false
      });
      res.status(200).render("user/couponsPage", {
        coupons,
        user: true,
        userInfo
      })
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  // ------add to wishlist--------- \\
  getWishList: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userId = user._id;
      const userInfo = await Userdb.userCollection.findById(userId);
      const wishlist = await WishListdb.wishListCollection.findOne({ userId: userId });

      let productDetails = [];

      if (wishlist && wishlist.items) {
        const productIds = wishlist.items.map(item => item.productId);

        const products = await Productdb.productCollection.find({ _id: { $in: productIds } });
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
      res.status(200).render("user/wishlist", {
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


      const userInfo = await Userdb.userCollection.findById(userId);


      let wishList = await WishListdb.wishListCollection.findOne({ userId });

      if (!wishList) {

        wishList = new WishListdb.wishListCollection({
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

          return res.status(400).json({
            success: false,
            message: "Product is already in the wishlist"
          });
        }
      }


      await wishList.save();


      res.status(200).json({
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

      const userInfo = await Userdb.userCollection.findById(userId);
      let wishList = await WishListdb.wishListCollection.findOne({ userId });
      if (wishList) {
        const itemIndex = wishList.items.findIndex(item => {
          return item.productId.toString() === productId.toString();
        });

        if (itemIndex !== -1) {
          wishList.items.splice(itemIndex, 1);

          await wishList.save();

          return res.status(200).json({
            success: true,
            message: "Product removed from wishlist successfully"
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Product not found"
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Wishlist not found"
        });
      }
    } catch (error) {
      console.log("Error removing product from wishlist:", error);
      next(error);
    }
  },
  //--------getting wallet page---------
  getWallet: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userId = user._id;
      console.log(userId, "this is the user id");

      const wallet = await Walletdb.walletCollection.findOne({ userId: userId });

      if (!wallet) {
        console.log("Wallet not found for user:", userId);
        return res.status(404).json({
          success: false,
          message: 'Wallet not found for the user'
        });
      }

      const userInfo = await Userdb.userCollection.findById(userId);

      console.log(wallet, "wallet");
      if (wallet) {
        console.log(wallet.balance, "balance");
      }
      // console.log(wallet.history);
      res.status(200).render("user/wallet", {
        success: true,
        wallet: wallet,
        user: true
      });

    } catch (error) {
      console.log('Error fetching wallet:', error);
      next(error);
    }
  },

  //--------add money to the wallet-----------
  addMoneyToWallet: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userId = user._id;
      const wallet = await Walletdb.walletCollection.findOne({ userId: user._id });
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
        const newWallet = new Walletdb.walletCollection({
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

      res.status(200).json({
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
    // console.log(req.params);
    try {
      const order = await Orderdb.orderCollection.findById(orderId).exec();

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

      // Payment Information
      doc.moveDown();
      doc.text('Thank you!', 50, 450);
      doc.moveDown();
      // doc.font('Helvetica-Bold').text('PAYMENT INFORMATION', 50, 470);
      doc.font('Helvetica').text('');
      // doc.text('Account Name: Samira Hadid');
      // doc.text('Account No.: 123-456-7890');
      doc.text('');
      doc.moveDown();
      // doc.text('Mazen furniture', 400, 530);
      // doc.text('Kollam, Kerala', 400, 550);

      doc.end();

    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).send('Server error');
    }
  },

  repayAmount: async function (req, res, next) {
    try {
      const user = verifyToken(req);
      const userId = user._id;
      const orderId = req.params.orderId;
      const orderDetails = await Orderdb.orderCollection.findById(orderId);
      const totalAmount = orderDetails.orderItems.reduce((sum, item) => {
        return sum + item.price;
      }, 0);
      res.status(200).render("user/re-payNow", {
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

      const order = await Orderdb.orderCollection.findOne({ userId: userId, paymentStatus: 'Pending' });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (paymentMethod === 'Razorpay') {
        const razorpayOrder = await instance.orders.create({
          amount: totalAmount * 100,
          currency: 'INR',
          receipt: uuidv4()
        });

        await Orderdb.orderCollection.updateOne(
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
        await Orderdb.orderCollection.updateOne(
          { _id: order._id },
          { $set: { paymentStatus: 'Pending', paymentMethod: 'COD' } }
        );

        return res.json({ success: true });
      } else {
        return res.status(400).json({
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
      await Orderdb.orderCollection.updateOne(
        { razorpayOrderId: order_id },
        { $set: { paymentStatus: 'Failed', paymentId: payment_id } }
      );
      return res.status(400).json({
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

      await Orderdb.orderCollection.updateOne(
        { razorpayOrderId: order_id },
        { $set: { paymentStatus: 'Success', paymentId: payment_id } }
      );
      res.redirect(`/user/orders`);
    } catch (error) {
      console.error('Error verifying payment:', error);
      next(error);
    }
  },

  handlePaymentFailure: async (order_id, payment_id) => {
    try {
      const result = await Orderdb.orderCollection.updateOne(
        { razorpayOrderId: order_id },
        { $set: { paymentStatus: 'Pending', paymentId: payment_id }, $setOnInsert: { updatedAt: new Date() } },
        { upsert: true }
      );
      console.log('Update result:', result);
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  },

  returnProduct: async (req, res, next) => {
    try {
      const { orderId, itemId, reason } = req.body;
      console.log(req.body);

      const order = await Orderdb.orderCollection.findOneAndUpdate(
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
        return res.status(404).json({
          success: false,
          message: 'Order or product not found'
        });
      }

      res.status(200).json({
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


      const product = await Productdb.productCollection.findById(productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }


      product.reviews.push(newReview);

      product.averageRating =
        product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length;
      await product.save();

      res.status(200).json({
        message: 'Review added successfully', product
      });
    } catch (err) {
      console.error(err);
      next(error)
    }
  },

}












