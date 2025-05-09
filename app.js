require('dotenv').config();
const express = require("express");
const path = require("path");
const session = require('express-session');
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const passport = require("./src/config/passport");
const expressLayouts = require('express-ejs-layouts');
const logger = require('morgan');
const db = require("./src/config/db");
const nocache = require('nocache');
const errorHandler = require('./src/utils/errorHandler');
const userRouter = require("./src/routes/userRouter");
const adminRouter = require("./src/routes/adminRouter");
const authRouter = require('./src/routes/auth-routes');
const paymentRouter = require('./src/routes/paymentRouter');
const appFeatRouter = require('./src/routes/appFeatRouter');
const PORT = process.env.PORT || 5000;
const app = express();




app.use(nocache());


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'))

app.use(cookieParser());
app.use(methodOverride("_method"));


app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use((req, res, next) => {
  res.locals.searchTerm = req.query.search || '';
  res.locals.user = req.user;
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});




app.use(userRouter);
app.use(adminRouter);
app.use(authRouter)
app.use(paymentRouter)
app.use(appFeatRouter)

// 404 Handler
app.use((req, res) => {
  res.status(404).render("404", {
    errorMessage: "Oops! Page Not Found",
    errorDescription: "The page you're looking for might have been removed or temporarily unavailable."
  });
});

// Error handler
app.use(errorHandler)


app.listen(PORT, async () => {
  await db();
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🕒 ${new Date().toLocaleString()}`);
});

module.exports = app;
