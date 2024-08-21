const jwt = require("jsonwebtoken");
const Userdb = require("../models/UserModels");
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

  exports.isUserAuthenticated = (req, res, next) => {
    try {
      if (req.cookies.token) {
        const token = req.cookies.token;
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user; 
        next();
      } else {
        res.redirect("/user/login");
      }
    } catch (err) {
      console.log(err);
      res.redirect("/user/login");
    }
  };
  
  exports.isUserBlocked = async (req, res, next) => {
    try {
      const user = await Userdb.userCollection.findById(req.user.id);
  
      if (user && user.blocked) {
      
        res.clearCookie('token'); 
  
      
        res.redirect('/user/login?blocked=true');
      } else {
        next();
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
