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






module.exports = { 
  sendOtp,
  resendOtp,
  upload,
  fetchOrderData


  };

