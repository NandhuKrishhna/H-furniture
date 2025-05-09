const express = require("express")
const productRouter = express.Router();
const productController = require("../controller/productController");
const { isUserAuthenticated } = require("../middleware/userAuth");

productRouter.get("/user/products", productController.getUserProducts)
productRouter.get("/user/search", productController.getUserProducts)
productRouter.get("/user/product/:id", productController.getProductDetails);


productRouter.get("/user/cart", isUserAuthenticated, productController.getCart)
productRouter.post("/user/add-to-cart", isUserAuthenticated, productController.addToCart)
productRouter.patch("/user/update-cart", isUserAuthenticated, productController.updateCart);
productRouter.delete("/user/delete-from-cart", isUserAuthenticated, productController.removeFromCart);

module.exports = productRouter