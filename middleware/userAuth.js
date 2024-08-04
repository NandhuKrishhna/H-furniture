const jwt = require("jsonwebtoken");

exports.isotpAuth = (req, res, next) => {
    if (req.session.email) {
      console.log("hiiii", req.session.email);
      next();
    } else {
      res.redirect("/user/login");
    }
  }


exports.signupAuth = (req, res, next) => {
    if (req.session.userdata) {
      next();
    } else {
      res.redirect("/user/signup");
    }
  };

exports.isuserAuthenticated = (req, res, next) => {
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

exports.noToken = (req,res,next)=>{
  
  if(!req.session.token){
    next();
  }else{
    res.redirect("/")
  }

}
