const express = require("express");
const router = express.Router();
const adminController = require("./../controller/adminController");
const auth = require("../middleware/adminAuth");
const { upload } = require("../utils/helpers");
const {

  validateLoginRules,
  validate,
  adminLoginRules,
  validateCategory,
  validateAddress,
  validateCoupon,
  productValidationRules,
  proValidate
 

} = require('../utils/errorhandling');







router.route("/admin/login")
.get(adminController.getAdminLogin)
.post(adminLoginRules, validate, adminController.verifyAdminLogin);

router.get("/admin/user_panel", auth.isadminAuthenticated, adminController.userManagement);
router.get("/admin/search", adminController.userSearch)

router.patch("/admin/user_panel/block_user/:id",  auth.isadminAuthenticated, adminController.blockUser);

router.patch("/admin/user_panel/unblock_user/:id",  auth.isadminAuthenticated, adminController.unblockUser);

router.get("/admin/category", auth.isadminAuthenticated, adminController.getCategory);


//------add category------
router.route("/admin/category/add-category")
.get( auth.isadminAuthenticated, adminController.getAddCategory)
.post( auth.isadminAuthenticated, validateCategory, validate, adminController.addCategory);

//-----edit
router.get("/admin/category/edit-category/:id", auth.isadminAuthenticated, adminController.getEditcategory);
router.put("/admin/category/edit-category/:id", auth.isadminAuthenticated, validateCategory, validate, adminController.editCategory);



router.delete("/admin/category/delete-category/:id", auth.isadminAuthenticated, adminController.deleteCategory);

router.get("/admin/products", auth.isadminAuthenticated, adminController.getAdminProduct);

router.get("/admin/products/add-product", auth.isadminAuthenticated, adminController.adminaddProduct);

router.post(
  "/admin/products/add-product", auth.isadminAuthenticated,  upload.array("files", 4),
  adminController.addProduct
);

router.delete("/admin/products/delete-product/:id",  auth.isadminAuthenticated, adminController.deleteProduct);

router.get("/admin/products/edit-product/:id", auth.isadminAuthenticated, adminController.getEditProduct);

router.put(
  "/admin/products/edit-product/:id",
  auth.isadminAuthenticated,
  upload.array("files", 4),
  adminController.editProduct

);




router.get("/admin/logout", adminController.adminLogout);

router.get("/admin/orders", auth.isadminAuthenticated, adminController.getOrdersPage)

router.post('/admin/orders/update-status',  auth.isadminAuthenticated, adminController.updateOrderStatus);
router.get('/admin/order/:orderId/item/:itemId', auth.isadminAuthenticated, adminController.orderDetails)
router.post('/admin/orders/approve-return', auth.isadminAuthenticated, adminController.approveReturn)
router.post('/admin/orders/reject-return', auth.isadminAuthenticated, adminController.rejectReturn)

router.get("/admin/coupons",  auth.isadminAuthenticated, adminController.couponManagement)

router.get("/admin/coupons/add-coupon",  auth.isadminAuthenticated, adminController.getAddCouponPage)
router.post("/admin/coupons/add-coupon",  auth.isadminAuthenticated, validateCoupon, validate, adminController.addCoupon)
router.get("/admin/coupons/edit-coupons/:id",  auth.isadminAuthenticated, adminController.getEditCoupon)
router.patch("/admin/coupons/edit-coupons/:id",  auth.isadminAuthenticated, validateCoupon, validate, adminController.editCoupon)

router.delete("/admin/coupons/delete-coupons/:id",  auth.isadminAuthenticated, adminController.deleteCoupon)


router.get('/admin/sales', adminController.getSaleReport);
router.get('/admin/sales/download', adminController.downlordSalesReport);

router.get("/admin/dashboard",  auth.isadminAuthenticated,adminController.dashboard)


module.exports = router