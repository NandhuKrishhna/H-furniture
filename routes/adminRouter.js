const express = require("express");
const router = express.Router();
const adminController = require("./../controller/adminController");
const auth = require("../middleware/adminAuth");
const { upload } = require("../utils/helpers");
const { productValidators } = require('../utils/errorhandling');
const { validationResult } = require('express-validator');

router.get("/admin/login", adminController.getAdminLogin);
router.post("/admin/login", adminController.verifyAdminLogin);

router.get("/admin/user_panel", auth.isadminAuthenticated, adminController.userManagement);

router.patch("/admin/user_panel/block_user/:id", adminController.blockUser);

router.patch("/admin/user_panel/unblock_user/:id", adminController.unblockUser);

router.get("/admin/category", auth.isadminAuthenticated, adminController.getCategory);

router.get("/admin/category/add-category", auth.isadminAuthenticated, adminController.getAddCategory);

router.post("/admin/category/add-category", auth.isadminAuthenticated, adminController.addCategory);

router.get("/admin/category/edit-category/:id", auth.isadminAuthenticated, adminController.getEditcategory);

router.put("/admin/category/edit-category/:id", auth.isadminAuthenticated, adminController.editCategory);

router.delete("/admin/category/delete-category/:id", auth.isadminAuthenticated, adminController.deleteCategory);

router.get("/admin/products", auth.isadminAuthenticated, adminController.getAdminProduct);

router.get("/admin/products/add-product", auth.isadminAuthenticated, adminController.adminaddProduct);

router.post(
  "/admin/products/add-product", auth.isadminAuthenticated, upload.array("files", 3),
  adminController.addProduct
);

router.delete("/admin/products/delete-product/:id", adminController.deleteProduct);

router.get("/admin/products/edit-product/:id", auth.isadminAuthenticated, adminController.getEditProduct);

router.put(
  "/admin/products/edit-product/:id",
  auth.isadminAuthenticated,
  upload.array("files", 3),
  adminController.editProduct
);

router.get("/admin/logout", adminController.adminLogout);









module.exports = router;
// router.get("/sample", adminController.sample);










module.exports = router