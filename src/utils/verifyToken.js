const jwt = require("jsonwebtoken");
const verifyToken = (req) => {
    const token = req.cookies.token;
    if (token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }
    return null;
};


module.exports = verifyToken