const mongoose = require('mongoose');
const { addressSchema } = require('./addressModel.js'); // Adjust the path accordingly

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user_data',
    required: true
  },
  orderItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product_data' },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      name: { type: String, required: true },
      image: { type: String, required: true },
      transactionId: { type: String, required: true },
      status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
      appliedCoupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'coupon_data', 
        default: null,
      }
    }
  ],
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  totalAmount: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Pending", "COD", "Failed", "Refunded", "Cancelled"],
    default: "Pending"
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Razorpay', 'Credit Card', 'Debit Card', 'Net Banking'],
    required: true
  }
},
  { timestamps: true });

  orderSchema.pre('save', function (next) {
    if (this.isModified('orderStatus')) {
      this.updatedAt = Date.now();
    }
    next();
  });


const orderCollection = mongoose.model('order_data', orderSchema);

module.exports = { orderCollection };
