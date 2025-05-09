const express = require("express");
const router = express.Router();
const adminController = require("./../controller/adminController");
const productController = require("../controller/admin/productManagement")
const couponController = require("../controller/admin/couponManagement")
const orderController = require("../controller/admin/orderManagement")
const auth = require("../middleware/adminAuth");
const { upload } = require("../utils/helpers");
const {
  validate,
  adminLoginRules,
  validateCategory,
  validateCoupon,



} = require('../utils/errorhandling');


router.route("/admin/login")
  .get(adminController.getAdminLogin)
  .post(adminLoginRules, validate, adminController.verifyAdminLogin);
router.get("/admin/user_panel", auth.isadminAuthenticated, adminController.userManagement);
router.get("/admin/search", adminController.userSearch)
router.patch("/admin/user_panel/block_user/:id", auth.isadminAuthenticated, adminController.blockUser);
router.patch("/admin/user_panel/unblock_user/:id", auth.isadminAuthenticated, adminController.unblockUser);
router.get("/admin/category", auth.isadminAuthenticated, productController.getCategory);
router.route("/admin/category/add-category")
  .get(auth.isadminAuthenticated, productController.getAddCategory)
  .post(auth.isadminAuthenticated, validateCategory, validate, productController.addCategory);

router.get("/admin/category/edit-category/:id", auth.isadminAuthenticated, productController.getEditcategory);
router.put("/admin/category/edit-category/:id", auth.isadminAuthenticated, validateCategory, validate, productController.editCategory);
router.delete("/admin/category/delete-category/:id", auth.isadminAuthenticated, productController.deleteCategory);
router.get("/admin/products", auth.isadminAuthenticated, productController.getAdminProduct);
router.get("/admin/products/add-product", auth.isadminAuthenticated, productController.adminaddProduct);
router.post(
  "/admin/products/add-product", auth.isadminAuthenticated, upload.array("files", 4),
  productController.addProduct
);
router.delete("/admin/products/delete-product/:id", auth.isadminAuthenticated, productController.deleteProduct);
router.get("/admin/products/edit-product/:id", auth.isadminAuthenticated, productController.getEditProduct);
router.put(
  "/admin/products/edit-product/:id",
  auth.isadminAuthenticated,
  upload.array("files", 4),
  productController.editProduct

);
router.get("/admin/logout", adminController.adminLogout);
router.get("/admin/orders", auth.isadminAuthenticated, orderController.getOrdersPage)
router.post('/admin/orders/update-status', auth.isadminAuthenticated, orderController.updateOrderStatus);
router.get('/admin/order/:orderId/item/:itemId', auth.isadminAuthenticated, orderController.orderDetails)
router.post('/admin/orders/approve-return', auth.isadminAuthenticated, orderController.approveReturn)
router.post('/admin/orders/reject-return', auth.isadminAuthenticated, orderController.rejectReturn)
router.get("/admin/coupons", auth.isadminAuthenticated, couponController.couponManagement)
router.get("/admin/coupons/add-coupon", auth.isadminAuthenticated, couponController.getAddCouponPage)
router.post("/admin/coupons/add-coupon", auth.isadminAuthenticated, validateCoupon, validate, couponController.addCoupon)
router.get("/admin/coupons/edit-coupons/:id", auth.isadminAuthenticated, couponController.getEditCoupon)
router.patch("/admin/coupons/edit-coupons/:id", auth.isadminAuthenticated, validateCoupon, validate, couponController.editCoupon)
router.delete("/admin/coupons/delete-coupons/:id", auth.isadminAuthenticated, couponController.deleteCoupon)
router.get('/admin/sales', adminController.getSaleReport);
router.get('/admin/sales/download', orderController.downlordSalesReport);

router.get("/admin/dashboard", auth.isadminAuthenticated, orderController.dashboard)


module.exports = router