const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user_data',  
        required: true
    },
    items: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'product_data',
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
});

const wishListCollection = mongoose.model('wishList-data', wishlistSchema);

module.exports = {wishListCollection};
