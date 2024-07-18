const jwt = require("jsonwebtoken");

const isotpAuth = (req, res, next) => {
    if (req.session.email) {
      console.log("hiiii", req.session.email);
      next();
    } else {
      res.redirect("/user/login");
    }
  }


  const signupAuth = (req, res, next) => {
    if (req.session.userdata) {
      next();
    } else {
      res.redirect("/user/signup");
    }
  };

  const isuserAuthenticated = (req, res, next) => {
    try {
      if (req.cookies.token) {
        const token = req.cookies.token;
        const user = jwt.verify(token, process.env.JWT_SECRET);
        next();
      } else {
        res.redirect("/user/login");
      }
    } catch (err) {
      console.log(err);
    }
  };



  module.exports = {
    isotpAuth,
    signupAuth,
    isuserAuthenticated,

  
  }