const Userdb = require("../models/UserModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Addressdb = require("../models/addressModel");
const { ObjectId } = require("mongodb");
const verifyToken = require("../utils/verifyToken");





module.exports = {

  userHomePage: async (req, res, next) => {
    res.render('user/home-page', {
      user: true
    })
  },

  getMyAccount: async (req, res, next) => {
    try {
      const token = req.cookies.token;

      if (token) {
        try {
          const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
          const userInfo = await Userdb.userCollection.findById(decodedToken._id).lean();

          res.status(200).render("user/my-account", {
            user: true,
            userInfo: userInfo
          });
        } catch (error) {

          res.status(200).render("user/my-account", {
            user: true,
            userInfo: null,
            myAccount: true,
          });
        }
      } else {

        res.status(200).render("user/my-account", {
          user: true,
          userInfo: null,
          myAccount: true,

        });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  postMyAccount: async (req, res, next) => {
    const { fname, lname, phone, email } = req.body;
    console.log('Request Body:', req.body); // Log request body

    try {
      const user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      console.log('Decoded User:', user); // Log decoded user info



      if (!fname || !lname || !phone || !email) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
      }
      // Check if the new email already exists
      const emailExists = await Userdb.userCollection.findOne({ email: email });
      if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }

      // Update user information
      await Userdb.userCollection.findByIdAndUpdate(user._id, {
        firstName: fname,
        lastName: lname,
        phone: phone,
        email: email
      });

      // Send success response
      res.status(200).json({
        success: true
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error: 'An error occurred' });
    }
  },

  getMyAddress: async (req, res, next) => {
    try {
      const user = verifyToken(req)
      const userInfo = await Userdb.userCollection.findById(user._id)
      const address = await Addressdb.addressCollection.find({
        userId: user._id,
        isDeleted: false
      })
      res.status(200).render("user/my-address", {
        user: true,
        userInfo,
        address,
      })
      console.log("useraddress", address,);

    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  getAddMyAddress: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userInfo = await Userdb.userCollection.findById(user._id);
      const redirectUrl = req.query.redirect || '/user/my-address';

      res.status(200).render("user/add_my_address", {
        user: true,
        userInfo,
        redirectUrl
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  addMyAddress: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userId = user._id;

      const data = {
        userId: new ObjectId(userId),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        homeAddress: req.body.address,
        landmark: req.body.landmark,
        city: req.body.city,
        street: req.body.street,
        state: req.body.state,
        phone: req.body.phone,
        country: req.body.country,
        pincode: req.body.pincode
      };
      const { redirectUrl } = req.body;
      console.log(data);
      console.log("---------------------------");

      const address = await Addressdb.addressCollection.insertMany(data);
      if (address) {
        res.status(201).json({
          success: true,
          redirectUrl: redirectUrl || '/user/my-address'
        });
      }

    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  getEditMyAddress: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userInfo = await Userdb.userCollection.findById(user._id);
      const addressId = req.params.id;
      const address = await Addressdb.addressCollection.findById(addressId);

      res.status(200).render("user/edit_my_address", {
        user: true,
        address: [address],
        userInfo
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  editMyAddress: async (req, res, next) => {
    try {
      const addressId = req.params.id;
      const updatedAddress = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        homeAddress: req.body.address,
        landmark: req.body.landmark,
        city: req.body.city,
        street: req.body.street,
        state: req.body.state,
        phone: req.body.phone,
        country: req.body.country,
        pincode: req.body.pincode
      };

      const address = await Addressdb.addressCollection.findByIdAndUpdate(
        addressId,
        { $set: updatedAddress },
        { returnDocument: 'after', new: true }
      );

      if (address) {
        res.status(200).redirect("/user/my-address");
      } else {
        res.status(404).send("Address not found");
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  getSetNewPassword: async (req, res, next) => {
    try {
      const user = verifyToken(req)
      const userInfo = await Userdb.userCollection.findById(user._id);
      res.status(200).render("user/setNewPassword", {
        user: true,
        userInfo,
      });
    } catch (error) {
      console.log(error);
      next(error)
    }
  },

  setNewPassword: async (req, res, next) => {
    try {
      const user = verifyToken(req);
      const userInfo = await Userdb.userCollection.findById(user._id);

      const { currentpassword, newpassword, confirmpassword } = req.body;

      console.log(currentpassword, "currentpassword");


      const isMatch = await bcrypt.compare(currentpassword, userInfo.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          errors: { currentpassword: { msg: "Current password is incorrect" } }
        });
      }


      if (newpassword !== confirmpassword) {
        return res.status(400).json({
          success: false,
          errors: { confirmpassword: { msg: "New password and confirm password should be the same" } }
        });
      }


      const hashedPassword = await bcrypt.hash(newpassword, 10);


      await Userdb.userCollection.findByIdAndUpdate(user._id, { password: hashedPassword });

      return res.status(200).json({
        success: true,
        message: "Password updated successfully"
      });

    } catch (error) {
      console.log(error);
      next(error);
    }
  },

  deleteAddress: async (req, res, next) => {
    try {
      const addressId = req.params.id;
      await Addressdb.addressCollection.updateOne(
        { _id: addressId },
        { $set: { isDeleted: true } }
      );
      res.status(200).json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "An error occurred while deleting the address" });
      next(error);
    }
  },

}
