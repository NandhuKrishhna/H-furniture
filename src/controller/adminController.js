const Admindb = require("../models/adminModels");
const Userdb = require("../models/UserModels");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");
const { fetchOrderData } = require("../utils/helpers");
const { OK, INTERNAL_SERVER_ERROR, NOT_FOUND, BAD_REQUEST } = require("../utils/http");


function convertDate(users) {
  users.forEach(element => {
    element.createdAt = new Date(element.createdAt).toLocaleString()
    element.updatedAt = new Date(element.updatedAt).toLocaleString()
  });
  return users;
}

module.exports = {
  getAdminLogin: async (req, res, next) => {
    try {
      if (req.cookies.adminToken) {
        const token = req.cookies.adminToken;
        // console.log("Token:", token);
        try {
          const admin = jwt.verify(token, process.env.ADMIN_SECRET);
          // console.log("Admin:", admin);
          if (admin) {
            return res.redirect("/admin/user_panel");
          } else {
            return res.status(OK).render("admin/login", {
              message: null,

            });
          }
        } catch (err) {
          console.log("Token verification failed:", err);
          return res.status(OK).render("admin/login", {
            message: null,

          });
        }
      } else {
        console.log("No token found, rendering login page");
        return res.status(OK).render("admin/login", {
          message: null,


        });
      }
    } catch (error) {
      console.log("Error in getAdminLogin:", error);
      return res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
  },
  verifyAdminLogin: async (req, res, next) => {
    try {
      const admin = await Admindb.adminCollection.findOne({ email: req.body.email });

      if (!admin) {
        return res.status(NOT_FOUND).json({
          customError: "Incorrect email or password"
        });
      }

      const passwordValid = await bcrypt.compare(req.body.password, admin.password);

      if (!passwordValid) {
        return res.status(NOT_FOUND).json({
          customError: "Incorrect email or password"
        });
      }

      const { _id } = admin;
      if (passwordValid) {
        const adminToken = jwt.sign({ _id }, process.env.ADMIN_SECRET);
        res.cookie("adminToken", adminToken, { httpOnly: true });
        return res.status(OK).json({
          success: true,
          message: "Login successful"
        });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
  userManagement: async (req, res, next) => {
    try {
      console.log(req.query);
      const users = await Userdb.userCollection.find({}).lean();
      const userData = convertDate(users);

      res.status(OK).render("admin/user_panel", {
        adminUser: true,
        users: users,
        userData,

      });
    } catch (error) {
      next(error);
    }
  },
  userSearch: async (req, res, next) => {
    try {
      const users = await Userdb.userCollection.find(req.query)
      res.status(OK).json({
        success: true,
        data: users
      })



    } catch (error) {
      res.status(BAD_REQUEST).json({
        sucess: false,
        error: error.message
      });
    }
  },
  blockUser: async (req, res, next) => {
    try {
      const id = new ObjectId(req.params.id);
      const user = await Userdb.userCollection.updateOne(
        { _id: id },
        { $set: { isBlocked: true } }
      );
      if (user.modifiedCount) {
        res.sendStatus(OK);
      }
    } catch (err) {
      next(err);
    }
  },
  unblockUser: async (req, res, next) => {
    try {
      const id = new ObjectId(req.params.id);
      const user = await Userdb.userCollection.updateOne(
        { _id: id },
        { $set: { isBlocked: false } }
      );
      console.log("This is users id:", id);
      if (user.modifiedCount) {
        res.sendStatus(OK);
      }
    } catch (err) {
      next(err);
    }
  },
  adminLogout: async (req, res, next) => {
    try {
      res.clearCookie("adminToken");
      res.redirect("/admin/login");
    } catch (error) {
      next(error);
    }
  },
  dashboard: async (req, res, next) => {
    try {
      const timeframe = req.query.timeframe || 'monthly';
      const data = await fetchOrderData(timeframe);
      res.status(OK).render("admin/dashboard", {
        data,
        timeframe
      });
    } catch (error) {
      console.log('Error fetching dashboard data:', error);
      next(error);
    }
  }
}