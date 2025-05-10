const { cartCollection } = require("../models/cartModel");
const { couponCollection } = require("../models/couponModel");
const { productCollection } = require("../models/productModels");
const { userCollection } = require("../models/UserModels");
const verifyToken = require("../utils/verifyToken");
const { ObjectId } = require("mongodb");

function calculateDiscountedPrice(originalPrice, discount) {
    return originalPrice - (originalPrice * discount / 100);
}
module.exports = {
    //user products
    getUserProducts: async (req, res, next) => {
        console.log('loging the products page')
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = 8;
            const sort = req.query.sort || 'featured';

            let pipeline = [
                {
                    $match: { isDeleted: false }
                },
                {
                    $lookup: {
                        from: "reviews",
                        localField: "_id",
                        foreignField: "product",
                        as: "reviews"
                    }
                },
                {
                    $addFields: {
                        averageRating: {
                            $avg: "$reviews.rating"
                        }
                    }
                }
            ];


            if (req.query.search) {
                const search = req.query.search;
                const regex = new RegExp(search, 'i');

                pipeline.push(
                    {
                        $lookup: {
                            from: "category_datas",
                            localField: "category",
                            foreignField: "_id",
                            as: "categoryInfo",
                        },
                    },
                    {
                        $unwind: "$categoryInfo",
                    },
                    {
                        $match: {
                            $or: [
                                { productName: { $regex: regex } },
                                { brand: { $regex: regex } },
                                { primarymaterial: { $regex: regex } },
                                { polishmaterial: { $regex: regex } },
                                { "categoryInfo.categoryName": { $regex: regex } },
                            ],
                        },
                    }
                );
            }

            if (req.query.category) {
                const categories = Array.isArray(req.query.category) ? req.query.category : [req.query.category];
                pipeline.push(
                    {
                        $lookup: {
                            from: 'category_datas',
                            localField: 'category',
                            foreignField: '_id',
                            as: 'categoryInfo'
                        }
                    },
                    {
                        $unwind: "$categoryInfo"
                    },
                    {
                        $match: {
                            'categoryInfo.name': { $in: categories }
                        }
                    }
                );
            }
            if (req.query.brand) {
                const brands = Array.isArray(req.query.brand) ? req.query.brand : [req.query.brand];
                pipeline.push({
                    $match: {
                        brand: { $in: brands }
                    }
                });
            }
            if (req.query.discount) {
                const discount = parseInt(req.query.discount);
                pipeline.push({
                    $match: {
                        discount: { $gte: discount }
                    }
                });
            }

            if (sort === 'name_asc' || sort === 'name_desc') {
                pipeline.push({
                    $addFields: {
                        productNameLower: { $toLower: "$productName" }
                    }
                });
            }

            switch (sort) {
                case 'price_asc':
                    pipeline.push({ $sort: { originalprice: 1 } });
                    break;
                case 'price_desc':
                    pipeline.push({ $sort: { originalprice: -1 } });
                    break;
                case 'name_asc':
                    pipeline.push({ $sort: { productNameLower: 1 } });
                    break;
                case 'name_desc':
                    pipeline.push({ $sort: { productNameLower: -1 } });
                    break;
                case 'newest':
                    pipeline.push({ $sort: { createdAt: -1 } });
                    break;
                default:
                    pipeline.push({ $sort: { _id: 1 } });
                    break;
            }
            const totalProductsResult = await productCollection.aggregate([
                ...pipeline,
                { $count: "total" }
            ]).exec();

            pipeline.push(
                {
                    $addFields: {
                        averageRating: {
                            $avg: "$reviews.rating"
                        }
                    }
                }
            );

            const totalProducts = totalProductsResult.length > 0 ? totalProductsResult[0].total : 0;
            const totalPages = Math.ceil(totalProducts / limit);
            const nextPage = page < totalPages ? page + 1 : null;

            pipeline.push(
                { $skip: (page - 1) * limit },
                { $limit: limit }
            );

            const products = await productCollection.aggregate(pipeline).exec();

            res.status(200).render("user/user_products", {
                user: true,
                page,
                search: req.query.search || '',
                sort,
                nextPage,
                totalPages,
                totalProducts,
                products,
                calculateDiscountedPrice: calculateDiscountedPrice,
                userProducts: true,
            });

        } catch (err) {
            console.error("Error in getUserProducts:", err);
            next(err);
        }
    },

    getProductDetails: async (req, res, next) => {
        try {

            const product = await productCollection
                .findById(req.params.id)
                .lean();
            const length = product.quantity
            if (req.session.token) {
                const user = jwt.verify(req.session.token, process.env.JWT_SECRET);
                const userInfo = await userCollection.findById(user._id).lean();
                const cart = await cartCollection
                    .findOne({ userId: new ObjectId(user._id) })
                    .lean();
                if (cart) {
                    count = cart.products.length;
                } else {
                    count = 0;
                }
                res.status(200).render("user/product-details", {
                    user: true,
                    product,
                    userInfo,
                    calculateDiscountedPrice: calculateDiscountedPrice,
                    length,
                    productDetails: true,
                })

            } else {
                res.status(200).render("user/product-details", {
                    user: true,
                    product,
                    calculateDiscountedPrice: calculateDiscountedPrice,
                    length,
                    productDetails: true,
                })
            }
            console.log(length, "-------------");

        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    addToCart: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id;
            const { productId, quantity } = req.body;

            if (quantity > 10) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot add more than 10 units of a product at a time."
                });
            }

            const product = await productCollection.findById(productId);

            if (!product.inStock) {
                return res.status(400).json({
                    success: false,
                    message: "Product is out of stock"
                });
            }

            if (quantity > product.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `There are only ${product.quantity} units in stock`
                });
            }

            const discountedPrice = calculateDiscountedPrice(product.originalprice, product.discount || 0);
            const productTotalPrice = discountedPrice * quantity;

            const cart = await cartCollection.findOne({ userId: userId });

            if (cart) {
                const productInCart = cart.products.find((p) => p.productId.toString() === productId.toString());

                if (productInCart) {
                    const totalQuantity = productInCart.quantity + quantity;

                    if (totalQuantity > 10) {
                        return res.status(400).json({
                            success: false,
                            message: `You already have ${productInCart.quantity} units in your cart. 
                  You can only add ${10 - productInCart.quantity} more units.`
                        });
                    }

                    if (totalQuantity > product.quantity) {
                        return res.status(400).json({
                            success: false,
                            message: `There are only ${product.quantity} units in stock and you already have ${productInCart.quantity} units in your cart.`
                        });
                    }

                    const updatedProductTotalPrice = discountedPrice * totalQuantity;

                    await cartCollection.updateOne(
                        { userId: userId, 'products.productId': productId },
                        {
                            $set: {
                                'products.$.quantity': totalQuantity,
                                'products.$.price': updatedProductTotalPrice
                            }
                        }
                    );
                } else {
                    await cartCollection.updateOne(
                        { userId: userId },
                        {
                            $push: {
                                products: {
                                    productId: productId,
                                    quantity: quantity,
                                    price: productTotalPrice,
                                    productName: product.productName,
                                    image: product.images[0]
                                }
                            }
                        },
                        { upsert: true }
                    );
                }

                const cartDetails = await cartCollection.findOne({ userId: userId });
                const updatedTotalAmount = cartDetails.products.reduce((total, product) => total + product.price, 0);

                await cartCollection.updateOne(
                    { userId: userId },
                    { $set: { totalAmount: updatedTotalAmount, finalAmount: updatedTotalAmount } }
                );

                res.status(200).json({
                    success: true,
                    updatedProductTotalPrice: productTotalPrice,
                    updatedTotalAmount: updatedTotalAmount,
                    finalAmount: updatedTotalAmount
                });
            } else {
                await cartCollection.create({
                    userId: userId,
                    products: [{
                        productId: productId,
                        quantity: quantity,
                        price: productTotalPrice,
                        productName: product.productName,
                        image: product.images[0]
                    }],
                    totalAmount: productTotalPrice,
                    finalAmount: productTotalPrice
                });

                res.status(200).json({
                    success: true,
                    updatedProductTotalPrice: productTotalPrice,
                    updatedTotalAmount: productTotalPrice,
                    finalAmount: productTotalPrice
                });
            }
        } catch (error) {
            console.log(error);
            next(error);
        }
    },

    getCart: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id;
            const userInfo = await userCollection.findById(userId);
            const cart = await cartCollection.findOne({ userId: userId }).populate('products.productId');


            const hadAddress = userInfo.address ? 'true' : 'false';


            const cartData = cart || {
                totalAmount: 0,
                finalAmount: 0,
                discountValue: 0,
                appliedCoupon: null,
                products: []
            };

            req.session.cart = cartData;


            res.status(200).render("user/cart", {
                user: true,
                cart: cartData,
                userInfo,
                hadAddress,
                userId
            });
        } catch (error) {
            console.log(error);
            next(error);
        }
    },

    updateCart: async (req, res, next) => {
        try {
            const user = verifyToken(req);
            const userId = user._id;
            const { productId, quantity } = req.body;


            const product = await productCollection.findOne({ _id: productId });
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            if (quantity > 10) {
                return res.status(400).json({
                    success: false,
                    message: "You can only add 10 units at a time"
                })
            }
            if (quantity > product.quantity) {
                return res.status(400).json({
                    success: false,
                    message: "There are only " + product.quantity + " units in stock"
                })
            }
            const price = calculateDiscountedPrice(product.originalprice, product.discount || 0);


            const updateResult = await cartCollection.updateOne(
                { userId: userId, 'products.productId': productId },
                {
                    $set: {
                        'products.$.quantity': quantity,
                        'products.$.price': price * quantity
                    }
                }
            );

            if (updateResult.modifiedCount === 0) {
                return res.status(404).json({ message: 'Cart item not found' });
            }
            const cart = await cartCollection.findOne({ userId: userId });
            if (!cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            const totalAmount = cart.products.reduce((total, product) => total + product.price, 0);


            const finalAmount = totalAmount;
            await cartCollection.updateOne(
                { userId: userId },
                {
                    $set: {
                        totalAmount: totalAmount,
                        finalAmount: finalAmount
                    }
                }
            );

            const updatedProduct = cart.products.find(p => p.productId.toString() === productId);
            res.status(200).json({
                message: 'Cart updated successfully',
                totalAmount,
                finalAmount,
                updatedPrice: updatedProduct.price
            });
        } catch (error) {
            console.error('Error updating cart:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    removeFromCart: async (req, res, next) => {
        try {
            const userInfo = verifyToken(req);
            const userId = new ObjectId(userInfo._id);
            const { productId } = req.body;

            // Remove the product from the cart
            const updatedCart = await cartCollection.updateOne(
                { userId },
                { $pull: { products: { productId: new ObjectId(productId) } } }
            );

            if (updatedCart.modifiedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found in cart'
                });
            }

            // Fetch the updated cart
            const cart = await cartCollection.findOne({ userId });

            if (!cart || !cart.products || cart.products.length === 0) {
                await cartCollection.updateOne(
                    { userId },
                    {
                        $unset: { appliedCoupon: "", discountValue: "" },
                        $set: { totalAmount: 0, finalAmount: 0 }
                    }
                );

                return res.json({
                    success: true,
                    updatedTotalAmount: 0,
                    finalAmount: 0,
                    discountValue: 0
                });
            }

            // Recalculate totalAmount
            const totalAmount = cart.products.reduce((sum, item) => sum + item.price * item.quantity, 0);

            let discount = 0;
            let finalAmount = totalAmount;

            if (cart.appliedCoupon) {
                const coupon = await couponCollection.findOne({ _id: cart.appliedCoupon });
                if (coupon) {
                    discount = coupon.discountType === 'fixed'
                        ? coupon.discountValue
                        : (totalAmount * coupon.discountValue) / 100;
                    if (coupon.maxDiscount) {
                        discount = Math.min(discount, coupon.maxDiscount);
                    }
                    finalAmount = totalAmount - discount;
                }
            }

            // Update totals in the cart
            await cartCollection.updateOne(
                { userId },
                {
                    $set: {
                        totalAmount,
                        finalAmount,
                        discountValue: discount
                    }
                }
            );

            res.json({
                success: true,
                updatedTotalAmount: totalAmount,
                finalAmount,
                discountValue: discount
            });

        } catch (error) {
            console.error('Error removing product from cart:', error);
            next(error);
        }
    }

}