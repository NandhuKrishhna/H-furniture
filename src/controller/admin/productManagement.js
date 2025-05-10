const { categoryCollection } = require("../../models/categoryModel");
const { productCollection } = require("../../models/productModels");
const { OK, INTERNAL_SERVER_ERROR, NOT_FOUND } = require("../../utils/http");
const fs = require('fs').promises;
const { ObjectId } = require('mongoose').Types;
const sharp = require('sharp');

function convertDate(users) {
    users.forEach(element => {
        element.createdAt = new Date(element.createdAt).toLocaleString()
        element.updatedAt = new Date(element.updatedAt).toLocaleString()
    });
    return users;
}
module.exports = {
    getCategory: async (req, res, next) => {
        try {
            const category = await categoryCollection
                .find({ isDeleted: false })
                .lean();
            const categoryData = convertDate(category)
            res.status(OK).render("admin/admin-category", {
                adminUser: true,
                category: true,
                category,
                categoryData,

            });
        } catch (er) {
            next(er);
        }
    },

    // getting Add catergory Page
    getAddCategory: (req, res, next) => {
        try {
            res.status(OK).render("admin/add-category", {
                adminUser: true,
                addCategory: true,

            });
        } catch (err) {
            console.log(err);
            next(err);
        }
    },

    // Add new catergory
    addCategory: async (req, res, next) => {
        try {
            const category = await categoryCollection.find({
                categoryName: { $regex: req.body.categoryName, $options: "i" },
                isDeleted: false,
            });

            if (category.length > 0) {
                return res.status(OK).json({
                    success: false,
                    customError: "Category already exists.",
                });
            } else {
                const data = {
                    categoryName: req.body.categoryName.toUpperCase(),
                };

                await categoryCollection.insertMany(data);
                return res.status(OK).json({
                    success: true,
                    message: "Category added successfully.",
                });
            }
        } catch (error) {
            console.log(error);
            next(error);
        }
    },


    deleteCategory: async (req, res, next) => {
        try {
            const deletedProduct =
                await categoryCollection.findByIdAndUpdate(req.params.id, {
                    isDeleted: true,
                });
            if (deletedProduct) {
                res.sendStatus(OK);
            }
        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    // getting the edit category page
    getEditcategory: async (req, res, next) => {
        try {
            const category = await categoryCollection
                .findById(req.params.id)
                .lean();

            res.status(OK).render("admin/edit-category", {
                adminUser: true,
                editCategory: true,
                categoryInfo: category,

            });
        } catch (err) {
            console.log(err);
            next(err);
        }
    },

    editCategory: async (req, res, next) => {
        try {
            const category = await categoryCollection.find({
                categoryName: { $regex: req.body.categoryName, $options: "i" },
                isDeleted: false,
            });
            if (category.length > 0) {
                res.status(400).json({
                    success: false,
                    customError: "Category already exists."
                });
            } else {
                const updatedCat = await categoryCollection.findByIdAndUpdate(
                    req.params.id,
                    {
                        $set: {
                            categoryName: req.body.categoryName.toUpperCase(),
                        },
                    }
                );
                console.log(req.body.categoryName);
                res.status(OK).json({
                    success: true,
                    message: "Category updated successfully.",
                });
            }
        } catch (error) {
            console.log(error);
            res.status(INTERNAL_SERVER_ERROR).json({
                success: false,
                customError: "An unexpected error occurred."
            });
        }
    },

    //getting admin product
    getAdminProduct: async (req, res, next) => {
        try {
            const products = await productCollection.aggregate([
                { $match: { isDeleted: false, }, },
                {
                    $lookup: {
                        from: "category_datas",
                        localField: "category",
                        foreignField: "_id",
                        as: "category",
                    },
                },
                { $unwind: "$category" },
                { $sort: { createdAt: -1 } },
            ]);

            const productsData = convertDate(products);

            res.status(OK).render("admin/admin-products", {
                adminUser: true,
                products: true,
                productsData,

            });
        } catch (err) {
            next(err);
        }
    },


    // getting product adding page
    adminaddProduct: async (req, res, next) => {
        try {
            const category = await categoryCollection.find().lean();
            res.status(200).render("admin/add-products", {
                adminUser: true,
                addProducts: true,
                category,

            });
        } catch (error) {
            next(error);
        }
    },


    addProduct: async (req, res, next) => {
        try {
            console.log(req.body);
            console.log(req.files);

            const resizedImages = [];
            for (const file of req.files) {
                const imagePath = `uploads/${file.filename}`;
                const resizedImagePath = `uploads/resized_${file.filename}`;

                await sharp(imagePath)
                    .resize(400, 400, {
                        fit: sharp.fit.cover,
                        position: sharp.strategy.entropy
                    })
                    .withMetadata()
                    .sharpen()
                    .toFormat('jpeg', { quality: 90 })
                    .toFile(resizedImagePath);

                await fs.unlink(imagePath);
                console.log("Image deleted successfully:", imagePath);

                resizedImages.push(resizedImagePath);
            }

            console.log('Resized images:', resizedImages);

            const category = await categoryCollection.findOne({
                categoryName: { $regex: req.body.category, $options: "i" }
            });

            if (!category) {
                throw new Error('Category not found');
            }

            const productdata = {
                productName: req.body.productname,
                description: req.body.description,
                originalprice: req.body.originalprice,
                discount: req.body.discount,
                category: category._id,
                weight: req.body.weight,
                quantity: req.body.quantity,
                brand: req.body.brand,
                primarymaterial: req.body.primarymaterial,
                floorstanding: req.body.floorstanding,
                polishmaterial: req.body.polishmaterial,
                color: req.body.color,
                material: req.body.material,
                images: resizedImages,
                countryofOrigin: req.body.countryofOrigin,
                warranty: req.body.warranty,
                dimension: req.body.dimension,
                fabric_options: req.body.fabric_options,
                inStock: req.body.quantity > 0 ? true : false
            };

            console.log(productdata);

            await productCollection.insertMany(productdata);
            res.redirect("/admin/products");
        } catch (error) {
            console.log(error);
            next(error);
        }
    },


    //getting edit product page
    getEditProduct: async (req, res, next) => {
        try {
            const categoryData = await categoryCollection.find({}).lean();

            const id = new ObjectId(req.params.id);
            const product = await productCollection.aggregate([
                { $match: { _id: id } },
                {
                    $lookup: {
                        from: "category_datas",
                        localField: "category",
                        foreignField: "_id",
                        as: "category",
                    },
                },
                { $unwind: "$category" },
            ]);

            res.status(OK).render("admin/edit-products", {
                adminUser: true,
                editProduct: true,
                categoryData,
                product,

            });
        } catch (error) {
            console.log(error);
            next(error);
        };

    },


    // admin editing products
    editProduct: async (req, res, next) => {
        try {
            const id = new ObjectId(req.params.id);
            const product = await productCollection.aggregate([
                { $match: { _id: id } },
                {
                    $lookup: {
                        from: 'category_datas',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'category',
                    },
                },
                { $unwind: '$category' },
            ])


            if (!product.length) {
                return res.status(NOT_FOUND).send('Product not found');
            }

            const updateFields = {
                productName: req.body.productname,
                description: req.body.description,
                originalprice: req.body.originalprice,
                discount: req.body.discount,
                weight: req.body.weight,
                quantity: req.body.quantity,
                brand: req.body.brand,
                primarymaterial: req.body.primarymaterial,
                floorstanding: req.body.floorstanding,
                polishmaterial: req.body.polishmaterial,
                color: req.body.color,
                material: req.body.material,
                countryofOrigin: req.body.countryofOrigin,
                warranty: req.body.warranty,
                dimension: req.body.dimension,
                fabric_options: req.body.fabric_options,
                inStock: req.body.quantity > 0 ? true : false,
                updatedAt: new Date(),
            };

            await productCollection.findOneAndUpdate(
                { _id: id },
                { $set: updateFields },
                { returnDocument: 'after' }
            );


            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const imagePath = `uploads/${file.filename}`;
                    const resizedImagePath = `uploads/resized_${file.filename}`;

                    await sharp(imagePath)
                        .resize({ width: 400, height: 400 })
                        .toFile(resizedImagePath);

                    await fs.unlink(imagePath);
                    console.log("Image resized and deleted:", imagePath);
                }
            }
            if (req.body.category) {
                const category = await categoryCollection.findOne({
                    categoryName: { $regex: req.body.category, $options: 'i' },
                });

                if (category) {
                    await productCollection.findOneAndUpdate(
                        { _id: id },
                        { $set: { category: category._id } },
                        { returnDocument: 'after' }
                    );
                }
            }


            res.redirect('/admin/products');
        } catch (err) {
            console.log(err);
            next(err);
        }
    },


    deleteProduct: async (req, res, next) => {
        try {
            const deleteProduct = await productCollection.findByIdAndUpdate(
                req.params.id,
                { $set: { isDeleted: true } }
            );

            if (deleteProduct) {
                res.sendStatus(200);
            } else {
                res.status(NOT_FOUND).send('Product not found');
            }
        } catch (err) {
            console.log(err);
            next(err);
        }
    },

}
