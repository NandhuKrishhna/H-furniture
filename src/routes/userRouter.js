const express = require("express")
const router = express.Router();
const userController = require("../controller/userController")
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
const { isUserAuthenticated } = require("../middleware/userAuth");
const {
    validate,
    validateChangePass,
    validateAddress,
} = require("../utils/errorhandling");

router.get("/", userController.userHomePage);
router.get("/home", userController.userHomePage)
router.route("/user/my-account")
    .get(isUserAuthenticated, userController.getMyAccount)
    .post(isUserAuthenticated, userController.postMyAccount)
router.get("/user/my-address", isUserAuthenticated, userController.getMyAddress)
router.route("/user/add_address")
    .get(isUserAuthenticated, userController.getAddMyAddress)
    .post(isUserAuthenticated, validateAddress, validate, userController.addMyAddress)
router.get("/user/edit_address/:id", isUserAuthenticated, userController.getEditMyAddress)
router.put("/user/edit_address/:id", isUserAuthenticated, validateAddress, validate, userController.editMyAddress)
router.delete("/user/delete_address/:id", isUserAuthenticated, userController.deleteAddress);
router.route("/user/set_new_password")
    .get(isUserAuthenticated, userController.getSetNewPassword)
    .post(isUserAuthenticated, validateChangePass, validate, userController.setNewPassword)


module.exports = router