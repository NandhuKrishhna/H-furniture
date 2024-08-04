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
      price: { type: Number, required: true }
    }
  ],
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  transactionId: { type: String, required: true },
  orderDate: { type: Date, default: Date.now },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  fulfilledStatus: {
    type: Boolean,
    default: false
  },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Pending", "COD", "Failed", "Refunded", "Cancelled"],
    default: "Pending"
  }
});

const orderCollection = mongoose.model('order_data', orderSchema);

module.exports = { orderCollection };
