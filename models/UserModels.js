const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  phone: { type: Number, required: false, sparse: true, default: null },
  // googleID: { type: String, unique: true, sparse: true }, 
  isBlocked: { type: Boolean, default: false, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

});

const userCollection = new mongoose.model("user_data", userSchema);

module.exports = { userCollection };
