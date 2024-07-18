const mongoose = require("mongoose");
const userotpSchema = new mongoose.Schema({
    otp: {
      type: Number,
      required: true,
    },
    otpId: {
      type: String,
    
    },
    generatedAt: {
      type: Date,
    },
    expireAt: {
      type: Date,
    },
  });
  
  const otpCollection = new mongoose.model("Otp", userotpSchema);
  
  module.exports = {otpCollection };
  