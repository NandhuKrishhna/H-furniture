require('dotenv').config();
const express = require("express");
const path = require("path");
const session = require('express-session');
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const passport = require("./config/passport");
const expressLayouts = require('express-ejs-layouts');
const logger = require('morgan');
const db = require("./config/db");
const nocache = require('nocache');
const errorHandler = require('./utils/errorHandler');
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

// Template locals
app.use((req, res, next) => {
  res.locals.searchTerm = req.query.search || '';
  res.locals.user = req.user;
  next();
});


// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});



// Other routes
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");
app.use(userRouter);
app.use(adminRouter);

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
