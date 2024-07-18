const mongoose = require("mongoose");
const validator = require("validator");

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please enter your email"],
    validator: [validator.isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
  },
});

const adminCollection = new mongoose.model("admin_data", adminSchema);

module.exports = { adminCollection };
