// userController.js
const User = require("../models/UserModels");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { handleErrors } = require("../utils/CustomerError");






const createToken = (id) => { 
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.LOGIN_EXPIRES, 
  });
};


exports.userLogin_get = (req, res) => {
  const token = req.cookies.jwt;
  if(token){
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        res.render("user/user_login");
      }else{
        res.render("user/user_home");
      }
    })
  }else{
    res.render("user/user_login");
  }
    
};

exports.userLogin_post = async(req, res) => {
  const  {email, password} = req.body;
    try {
      const user = await User.login(email, password);
      const token  = createToken(user._id);
      res.cookie("jwt",token,{
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      })
      res.status(200).json({user: user._id});
    } catch (err) {
      console.log(err);
      const errors = handleErrors(err);
      res.status(400).json({errors});
  }
};

exports.userSignUp_get = (req, res) => {
    res.render("user/user_signup");
};

// User registration
exports.userSignUp_post = async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body;
  try {
      const user = await User.create({
          firstName,
          lastName,
          email,
          password,
          phone 
      });
      const token  = createToken(user._id);
      res.cookie("jwt",token,{
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      })
      res.status(201).json({user: user._id});
    
  } catch (err) {
      console.log(err);
      const errors = handleErrors(err);
      res.status(400).json({errors});
  }
};
exports.userHomePage_get = (req, res) => {
    res.render("user/user_home");
};








exports.userLogout_get = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/users/login");
}