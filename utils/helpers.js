const nodemailer = require("nodemailer");
const dbOtp = require("../models/otpModel");
const multer = require("multer")





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
    const expireTimeInMilliseconds = 5 * 60 * 1000; 

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

module.exports = { 
  sendOtp,
  resendOtp,
  upload

  };







