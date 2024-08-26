const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ }, 
  password: { type: String, required: false },
  phone: { type: String, required: false, default: null }, 
  googleID: { type: String, unique: true, sparse: true },
  isBlocked: { type: Boolean, default: false, required: true }
}, {
  timestamps: true 
});

const userCollection = new mongoose.model("user_data", userSchema);

module.exports = { userCollection };
