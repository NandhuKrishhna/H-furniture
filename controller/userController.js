const Userdb = require("../models/UserModels");
const Otpdb = require("../models/otpModel")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {sendOtp, resendOtp} = require("../utils/helpers");
const Productdb = require("../models/productModels")
const Categroydb = require("../models/categoryModel")




//getting user signup page
const getUserSignup = (req, res, next) => {
    res.status(200).render("user/user_signup", { signupPage: true });
  };
  //user registration
  const userRegistration = async (req, res, next) => {
    const data = {
      firstName: req.body.fname,
      lastName: req.body.lname,
      email: req.body.email,
      password: await bcrypt.hash(req.body.password, 10),
      phone: req.body.phone,
    };
    console.log(data);
    try {
      const existuser = await Userdb.userCollection.findOne({ email: data.email });
      if (existuser) {
        res.status(400).render("user/user_signup", { userExist: true });
      } else {
        req.session.userdata = data;
        sendOtp(req.body.email, req.body.email)
          try {
            
            res.redirect("/user/submit_otp");
          } catch (error) {
            next(error);
          }
          
      }
    } catch (err) {
      next(err);
    }
  };
  


//get signup submit otp
const getsubmitSignupotp = async (req,res,next) => {
  res.status(200).render("user/otp_submit")
}
  //submit the signup otp
  
  const submitSignupotp = async (req, res, next) => {
    try {
      const isOtp = await Otpdb.otpCollection.findOne({
        otpId: req.session.userdata.email,
      });
      const time = Date.now();
      if (req.body.otp == isOtp.otp) {
        if (isOtp.expireAt >= time) {
          const userInserted = await Userdb.userCollection.insertMany(
            req.session.userdata
          );
  
          if (userInserted) {
            res.status(200).render("user/home", { 
              userRegistered: true,
              user:true, 
            });
            req.session.userdata = "";
          }
        } else {
          res.status(400).render("user/otp_submit", { errors:[{msg:"OTP Expired"}] });
        }
      } else {
        res.status(400).render("user/otp_submit", { errors:[{msg:"Invalid OTP"}] });
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  };


  const resendSignUpOtp = async (req, res, next) => {
    try {
      const data = await resendOtp(
        req.session.userdata.email,
        req.session.userdata.email
      );
      console.log("OTP resent to email:", req.session.userdata.email);
      console.log(data);
      res.status(200).json(data);
    } catch (error) {
      console.error("Error in resendSignUpOtp:", error);
      res.status(500).json({ error: "Failed to resend OTP" });
    }
  };


const getUserLogin = (req, res, next) => {
    try {
      if (req.cookies.token) {
        const user = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        if (user) {
          res.redirect("/");
        }
      } else {
        req.session.destroy();
        res.status(200).render("user/login", { loginPage: true });
      }
    } catch (err) {
      res.status(500).send("internal server error");
    }
  };


  const userSignin = async (req, res, next) => {
       console.log(req.body);
      try {
        const existUser = await Userdb.userCollection
          .findOne({email: req.body.email,}).lean();
  
        if (existUser) {
          const { _id } = existUser;
          const password = existUser.password;
          const isMatch = await bcrypt.compare(req.body.password, password);
          if (isMatch) {
            if (existUser.isBlocked) {
              res.status(400).render("user/login", { blockedUser: true });
            } else {
              const token = jwt.sign({ _id }, process.env.JWT_SECRET);
              res.cookie("token", token, {
                httpOnly: true,
              });
              res.redirect("/");
            }
          } else {
            res.status(400).render("user/login", { invalidUser: true });
          }
        } else {
          res.status(400).render("user/login", { userNotExist: true });
        }
      } catch (err) {
        console.log(err);
        next(err);
      }
    
};
const userHomePage = async (req, res, next) => {
    res.status(200).render("user/home",{
      user:true
    })
}


const getUserProducts = async (req, res, next) => {
   try {
    const products = await Productdb.productCollection
      .find({isDeleted: false,})
      .lean();
      

      res.status(200).render("user/user_products",{
        products,
        user:true,
      })
   } catch (error) {
    console.log(error);
    next(error)
   }
}

//product details
const getProductDetails = async (req, res, next) => {
  try {
    
   const product = await Productdb.productCollection
   .findById(req.params.id)
   .lean();
   if(req.session.token){
    const user = jwt.verify(req.session.token,process.env.JWT_SECRET);
    const userInfo = await Userdb.userCollection.findById(user._id).lean();

    res.status(200).render("user/product-details",{
      user:true,
      product,
      userInfo
   })

   }else{
    res.status(200).render("user/product-details",{
      user:true,
      product,
   })
   }




  } catch (error) {
    console.log(error);
    next(error)
  }


}


// user logout
const userLogout = (req, res, next) => {
  res.clearCookie("token");
  res.redirect("/user/login");
};




module.exports = {

    getUserSignup,
    userRegistration,
    getsubmitSignupotp,
    submitSignupotp,
    resendSignUpOtp,
    getUserLogin,
    userSignin,
    userHomePage,
    getUserProducts,
    userLogout,
    getProductDetails



}