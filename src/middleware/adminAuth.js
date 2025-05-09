const jwt = require("jsonwebtoken");
const isadminAuthenticated = (req, res, next) => {
  try {
    if (req.cookies.adminToken) {
      const token = req.cookies.adminToken;
      const admin = jwt.verify(token, process.env.ADMIN_SECRET);
      if (admin) {
        next();
      }
    } else {
      res.redirect("/admin/login");
    }
  } catch (err) {
    console.log(err);
  }
};







module.exports = { isadminAuthenticated }