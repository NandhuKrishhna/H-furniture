const nodemailer = require("nodemailer");
const dbOtp = require("../models/otpModel");
const multer = require("multer")
const Cartdb = require("../models/cartModel" );
const Productdb = require("../models/productModels");
const Addressdb = require("../models/addressModel")
const Orderdb = require("../models/orderModel");
const { getProductDetails } = require("../controller/userController");





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




//////>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//funciton of fetching product, cart and order details 



const cartDetails = async (userId) => {
  try {
    const cart = await Cartdb.cartCollection.findOne({ userId: userId }).populate('products.productId').exec();
    if (!cart) {
        throw new Error('Cart not found');
    }
    return cart;
} catch (error) {
    console.error('Error fetching cart details:', error);
    throw error;
}
}

const orderDetails = async (userId) => {
  try {
    const order = await Orderdb.orderCollection.findOne({ userId: userId });
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
}

const productDetails = async (productId) => {
  try {
    const product = await Productdb.productCollection.findById(productId).exec();
    if (!product) {
        throw new Error('Product not found');
    }
    return product;
} catch (error) {
    console.error('Error fetching product details:', error);
    throw error;
}
}


module.exports = { 
  sendOtp,
  resendOtp,
  upload,
  cartDetails,
  orderDetails,
  productDetails


  };

