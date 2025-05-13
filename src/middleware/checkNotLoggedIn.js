const jwt = require("jsonwebtoken");
const checkNotLoggedIn = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return res.redirect("/");
        } catch (err) {
            res.clearCookie("token");
        }
    }

    next();
};
module.exports = checkNotLoggedIn;
