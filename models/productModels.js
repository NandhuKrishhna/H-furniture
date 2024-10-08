const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "user_data", 
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5, 
  },
  comment: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  originalprice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  inStock: {
    type: Boolean,
    required: true,
    default: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  description: {
    type: [String],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  primarymaterial: {
    type: String,
    required: true,
  },
  floorstanding: {
    type: String,
    required: true,
  },
  polishmaterial: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  color: {
    type: [String],
  
  },

images: {
    type: [String],
    required: true,
  },
  material: {
    type: String,
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  warranty: {
    type: String,
    required: true
  },
  countryofOrigin: {
    type: String,
    required:true

  },
  fabric_options: {
    type: String,
    required: true
  },
  dimension: {
    type: String, 
    required: true  
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  reviews : [reviewSchema],
  averageRating: {
    type: Number,
    default: 0,
  },
});
productSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = parseFloat((totalRating / this.reviews.length).toFixed(1));
  } else {
    this.averageRating = 0;
  }
  next();
});

productSchema.pre('findOneAndUpdate', async function(next) {
  if (this._update.reviews) {
    const updatedReviews = this._update.reviews;
    const totalRating = updatedReviews.reduce((acc, review) => acc + review.rating, 0);
    this._update.averageRating = parseFloat((totalRating / updatedReviews.length).toFixed(1));
  }
  next();
});

const productCollection = new mongoose.model("product_data", productSchema);
module.exports = { productCollection };
