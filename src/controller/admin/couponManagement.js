const { couponCollection } = require("../../models/couponModel");
const { OK, BAD_REQUEST, NOT_FOUND } = require("../../utils/http");
const CouponModel = require("../../models/couponModel");

module.exports = {
    couponManagement: async (req, res, next) => {
        try {

            const coupons = await couponCollection.find({
                isDeleted: false
            })

            console.log(coupons);
            res.status(OK).render("admin/coupons", {
                coupons
            })


        } catch (error) {
            console.log(error);
            next(error)
        }
    },

    getAddCouponPage: async (req, res, next) => {
        try {
            res.status(OK).render("admin/add-coupons")

        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    addCoupon: async (req, res, next) => {
        try {
            const data = {
                code: req.body.code,
                discountType: req.body.discountType,
                discountValue: req.body.discountValue,
                maxDiscount: req.body.maxDiscount,
                minPurchaseAmount: req.body.minPurchaseAmount,
                usageLimit: req.body.usageLimit,
                validFrom: req.body.validFrom,
                validUntil: req.body.validUntil,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            console.log(data);
            const dataExit = await couponCollection.findOne({ code: req.body.code });
            console.log("Coupon exit ?", dataExit)
            if (dataExit) {
                return res.status(BAD_REQUEST).json({
                    success: false,
                    message: "Coupon code already exists"
                });
            }
            const coupon = new CouponModel.couponCollection(data);
            await coupon.save();

            res.redirect('/admin/coupons');

        } catch (error) {
            console.log(error);
            next(error);
        }
    },


    getEditCoupon: async (req, res, next) => {

        try {

            const couponId = req.params.id;
            const coupon = await couponCollection.findById(couponId)
            res.status(OK).render("admin/edit-coupons", {
                coupon
            })


        } catch (error) {
            console.log(error);
            next(error)
        }

    },

    editCoupon: async (req, res, next) => {
        try {
            const couponId = req.params.id;
            const updatedData = {
                code: req.body.code,
                discountType: req.body.discountType,
                discountValue: req.body.discountValue,
                maxDiscount: req.body.maxDiscount,
                minPurchaseAmount: req.body.minPurchaseAmount,
                usageLimit: req.body.usageLimit,
                validFrom: req.body.validFrom,
                validUntil: req.body.validUntil,
                updatedAt: new Date()
            };

            console.log('Updated Data:', updatedData);

            const coupon = await couponCollection.findByIdAndUpdate(couponId, updatedData, { new: true });

            if (!coupon) {
                return res.status(NOT_FOUND).json({
                    success: false,
                    message: "Coupon not found"
                });
            }

            res.status(OK).json({
                success: true,
                message: "Coupon updated successfully",
                coupon
            });
        } catch (error) {
            console.log("Error from editCoupon:", error);
            next(error);
        }
    },


    deleteCoupon: async (req, res, next) => {
        try {
            const deleteCoupon = await couponCollection.findByIdAndUpdate(
                req.params.id,
                { $set: { isDeleted: true } }
            );

            res.sendStatus(OK);
        } catch (err) {
            console.log(err);
            next(err);
        }
    },

}