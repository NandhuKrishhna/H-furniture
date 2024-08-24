const mongoose = require('mongoose');
const { addressSchema } = require('../models/addressModel'); 

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
      status: { type: String, enum: ['Order Placed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Return Requested'], default: 'Order Placed' },
      appliedCoupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'coupon_data',
        default: null,
      },
      discountValue: { type: Number, default: 0 },
      returnRequest: {
        reason: { type: String, default: '' },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: null }, 
        requestDate: { type: Date, default: null },
        approvalDate: { type: Date, default: null },
      }
      ,
    }
  ],
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  totalAmount: { type: Number, required: true },
  discountValue: { type: Number, default: 0 }, 
  orderDate: { type: Date, default: Date.now },
  orderStatus: {
    type: String,
    enum: ['Order Placed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Return requested'],
    default: 'Order Placed'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Success', 'Failed'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  razorpayOrderId: {
    type: String,
    default: null
  },
  orderId : {
    type: String,
    default: null
  }

},
{ timestamps: true });

orderSchema.pre('save', function (next) {
  
  if (this.isModified('orderStatus')) {
    this.updatedAt = Date.now();
  }

  const numberOfItems = this.orderItems.length;

  if (numberOfItems > 0 && this.discountValue > 0) {
    const discountPerItem = this.discountValue / numberOfItems;

    this.orderItems.forEach(item => {
      item.discountValue = discountPerItem;
    });
  }

  next();
});

const orderCollection = mongoose.model('order_data', orderSchema);

module.exports = { orderCollection };
