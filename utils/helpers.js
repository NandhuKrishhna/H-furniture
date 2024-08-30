const nodemailer = require("nodemailer");
const dbOtp = require("../models/otpModel");
const multer = require("multer")
const Cartdb = require("../models/cartModel" );
const Productdb = require("../models/productModels");
const Addressdb = require("../models/addressModel")
const Orderdb = require("../models/orderModel")
const Wallectdb = require("../models/walletModel")
const { getProductDetails } = require("../controller/userController");
const Categorydb = require("../models/categoryModel");
const { createStructParentTreeNextKey } = require("pdfkit");
const Coupondb = require("../models/couponModel");




const Storage = multer.diskStorage({
  destination :(req,file,cb) =>{
    cb(null, "./uploads")
  },
  filename:(req,file,cb) => {
   cb(null,`${Date.now()}-${file.originalname}`);
  }
})

const upload = multer({storage:Storage})



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODMAILER_EMAIL,
    pass: process.env.NODMAILER_PASSWORD,
  },
});

async function sendOtp(email,id) {
  const Otp = generateOtp();

  try {
    const expireTimeInMilliseconds = 2 * 60 * 1000; 

const otpinfo = await dbOtp.otpCollection.updateOne(
  { otpId: id },
  {
    $set: {
      otp: Otp,
      otpId: id,
      generatedAt: Date.now(),
      expireAt: Date.now() + expireTimeInMilliseconds,
    },
  },
  { upsert: true }
);
    console.log("OTP info:", otpinfo);

    const details = {
      from: "habusfurniture@gmail.com",
      to: email,
      subject: `Your OTP Code`,
      text: `Your OTP (One-Time-Password) is: ${Otp}`,
    };

    return new Promise((resolve, reject) => {
      transporter.sendMail(details, (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve("Email sent: " + info.response);
        }
      });
    });
  } catch (err) {
    console.error("Error updating OTP in the database:", err);
    throw err;
  }
}




async function resendOtp(email, id) {
  try {
    await sendOtp(email, id);
    return {
      message: `OTP has been resent to ${email}`,
    };
  } catch (error) {
    console.error("Failed to resend OTP:", error);
    throw error;
  }
}
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}





async function fetchOrderData(timeframe = 'monthly') {
  try {
    const matchStage = {};

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    if (timeframe === 'daily') {
      matchStage.orderDate = { $gte: startOfDay };
    } else if (timeframe === 'monthly') {
      matchStage.orderDate = { $gte: startOfMonth };
    } else if (timeframe === 'yearly') {
      matchStage.orderDate = { $gte: startOfYear };
    }

    const totalProducts = await Orderdb.orderCollection.aggregate([
      { $match: matchStage },
      { $unwind: '$orderItems' },
      { $group: { _id: null, totalProducts: { $sum: '$orderItems.quantity' } } }
    ]);

    const totalSalesAmount = await Orderdb.orderCollection.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } }
    ]);

    const totalSalesCount = await Orderdb.orderCollection.countDocuments(matchStage);

    const totalProductPrice = await Orderdb.orderCollection.aggregate([
      { $match: matchStage },
      { $unwind: '$orderItems' },
      { $group: { _id: null, totalPrice: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] } } } }
    ]);

    const topFiveProducts = await Orderdb.orderCollection.aggregate([
      { $match: matchStage },
      { $unwind: '$orderItems' },
      { $group: { _id: '$orderItems.productId', totalQuantity: { $sum: '$orderItems.quantity' } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    const onlinePayments = await Orderdb.orderCollection.countDocuments({ ...matchStage, paymentMethod: 'Razorpay' });
    const cashOnDelivery = await Orderdb.orderCollection.countDocuments({ ...matchStage, paymentMethod: 'COD' });
    const cancelledOrders = await Orderdb.orderCollection.countDocuments({ ...matchStage, orderStatus: 'Cancelled' });

    const uniqueUserIds = await Orderdb.orderCollection.distinct('userId', matchStage);
    const totalCustomers = uniqueUserIds.length;

    const topFiveProductIds = topFiveProducts.map(product => product._id);
    const topFiveProductDetails = await Productdb.productCollection.find({ _id: { $in: topFiveProductIds } });

    const totalRefundedAmount = await Wallectdb.walletCollection.aggregate([
      { $unwind: "$history" },
      { $match: { "history.transactionType": "Refunded", "history.date": { $gte: matchStage.orderDate } } },
      { $group: { _id: null, totalRefunded: { $sum: "$history.amount" } } },
      { $project: { _id: 0, totalRefunded: 1 } }
    ]);

    const refundSum = totalRefundedAmount[0]?.totalRefunded || 0;

    const brandNames = await Orderdb.orderCollection.aggregate([
      { $match: matchStage },
      { $unwind: "$orderItems" },
      { $lookup: {
        from: "product_datas",
        localField: "orderItems.productId",
        foreignField: "_id",
        as: "productDetails"
      }},
      { $unwind: "$productDetails" },
      { $group: { _id: "$productDetails.brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const topCategoryName = await Orderdb.orderCollection.aggregate([
      { $match: matchStage },
      { $unwind: "$orderItems" },
      { $lookup: {
        from: "product_datas",
        localField: "orderItems.productId",
        foreignField: "_id",
        as: "productDetails"
      }},
      { $unwind: "$productDetails" },
      { $lookup: {
        from: "category_datas",
        localField: "productDetails.category",
        foreignField: "_id",
        as: "categoryDetails"
      }},
      { $unwind: "$categoryDetails" },
      { $group: { _id: "$categoryDetails.categoryName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const monthlySales = await Orderdb.orderCollection.aggregate([
      { $match: matchStage },
      { $unwind: '$orderItems' },
      { $group: {
        _id: {
          year: { $year: '$orderDate' },
          month: { $month: '$orderDate' }
        },
        totalSales: { $sum: { $multiply: ['$orderItems.quantity', '$orderItems.price'] } }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const formattedMonthlySales = monthlySales.map(sale => ({
      month: `${sale._id.year}-${sale._id.month.toString().padStart(2, '0')}`,
      totalSales: sale.totalSales
    }));

    return {
      totalProducts: totalProducts[0]?.totalProducts || 0,
      totalSalesAmount: totalSalesAmount[0]?.totalAmount || 0,
      totalSalesCount,
      totalProductPrice: totalProductPrice[0]?.totalPrice || 0,
      topFiveProducts: topFiveProductDetails.map(product => ({
        _id: product._id,
        productName: product.productName,
        brand: product.brand,
        category: product.category,
        quantitySold: topFiveProducts.find(p => p._id.equals(product._id)).totalQuantity
      })),
      topCategories: topCategoryName,
      topBrands: brandNames,
      monthlySales: formattedMonthlySales,
      totalCustomers,
      onlinePayments,
      cashOnDelivery,
      cancelledOrders,
      totalRefundedAmount: refundSum
    };
  } catch (error) {
    console.log('Error fetching order data:', error);
    throw error;
  }
}

async function fetchSaleReportData(period) {
  const matchStage = {};
  if (period === 'daily') {
    matchStage['orderDate'] = {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)), 
      $lt: new Date(new Date().setHours(24, 0, 0, 0)) 
    };
  } else if (period === 'monthly') {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
    matchStage['orderDate'] = {
      $gte: startOfMonth,
      $lte: endOfMonth
    };
  } else if (period === 'yearly') {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const endOfYear = new Date(new Date().getFullYear() + 1, 0, 0, 23, 59, 59);
    matchStage['orderDate'] = {
      $gte: startOfYear,
      $lte: endOfYear
    };
  }

  const totalOrders = await Orderdb.orderCollection.countDocuments();
  const uniqueUserIds = await Orderdb.orderCollection.distinct('userId');
  const totalCustomers = uniqueUserIds.length;
  const onlinePayments = await Orderdb.orderCollection.countDocuments({ paymentMethod: 'Razorpay' });
  const cashOnDelivery = await Orderdb.orderCollection.countDocuments({ paymentMethod: 'COD' });
  const cancelledOrders = await Orderdb.orderCollection.countDocuments({ orderStatus: 'Cancelled' });
  const totalSales = await Orderdb.orderCollection.aggregate([
    { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }
  ]);
  const totalCouponsUsed = await Coupondb.couponCollection.aggregate([
    { $group: { _id: null, couponsUsed: { $sum: "$couponsUsed" } } }
  ]);
  const totalRefundedAmount = await Wallectdb.walletCollection.aggregate([
    { $unwind: "$history" },
    {
      $match: {
        "history.transactionType": "Refunded"
      }
    },
    {
      $group: {
        _id: null,
        totalRefunded: { $sum: "$history.amount" }
      }
    },
    {
      $project: {
        _id: 0,
        totalRefunded: 1
      }
    }
  ]);

  const refundSum = totalRefundedAmount[0]?.totalRefunded || 0;
  const orders = await Orderdb.orderCollection.find();

  const productIds = orders.flatMap(order => order.orderItems.map(item => item.productId));
  const products = await Productdb.productCollection.find({ _id: { $in: productIds } }).select('originalprice discount');

  const orderDetails = orders.map(order => {
    return order.orderItems.map(item => {
      const product = products.find(p => p._id.equals(item.productId));
      const originalPrice = product ? product.originalprice : 0;
      const discount = product ? product.discount : 100;
      const discountPrice = Math.floor(originalPrice * discount / 100);
      const soldPrice = Math.floor(originalPrice - discountPrice);

      return {
        fullName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        orderId: order._id,
        date: new Date(order.orderDate).toLocaleDateString(),
        productName: item.name,
        originalPrice: originalPrice,
        soldPrice: soldPrice,
        offer: order.offer || 'N/A',
        discount: discount,
        couponApplied: item.appliedCoupon || 'None',
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      };
    });
  }).flat();

  return {
    totalOrders,
    totalCustomers,
    totalRefundedAmount: refundSum,
    onlinePayments,
    cashOnDelivery,
    cancelledOrders,
    totalSales: totalSales[0]?.totalAmount || 0,
    totalCouponsUsed: totalCouponsUsed[0]?.couponsUsed || 0,
    orderDetails,
  };
}





module.exports = { 
  sendOtp,
  resendOtp,
  upload,
  fetchOrderData,
  fetchSaleReportData

  };

