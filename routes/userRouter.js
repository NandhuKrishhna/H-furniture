const express = require("express");
const router = express.Router();
const  userController = require("./../controller/userController")
const authVerify = require("./../middleware/userMiddleware")





router.get("/users/login",userController.userLogin_get)
router.post("/users/login",userController.userLogin_post)
router.get("/users/signup",userController.userSignUp_get)
router.post("/users/signup",userController.userSignUp_post)
router.get("/users/home",authVerify.requireAuth,userController.userHomePage_get)
router.get("/users/logout",userController.userLogout_get)




module.exports = router;