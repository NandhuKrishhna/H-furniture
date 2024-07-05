const jwt = require("jsonwebtoken");
const User = require("../models/UserModels");



const requireAuth = async (req, res, next) => {
    const token = req.cookies.jwt;


    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
            if (err) {
                res.redirect("/users/login");
            }else{
                next();  
            }




        })
    } else {
        res.redirect("/users/login");
    }
}





module.exports = { requireAuth }