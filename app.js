const express = require("express");
const app = express();
const session = require('express-session');
const hbs = require("express-handlebars");
const path = require("path");
const db = require("./config/db");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const passport = require("./config/passport");
// const flash = require("connect-flash");
const Handlebars = require('handlebars');

db();
require("dotenv").config();
Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper("arrayIndex", function (array, index) {
  return array && array[index];
});
Handlebars.registerHelper('calculateDiscountedPrice', function(originalprice, discount) {
  return (originalprice - (originalprice * (discount / 100))).toFixed(2);
});
Handlebars.registerHelper('mod', function(index, num, options) {
  if (index % num === 0) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));




const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");
const { handleError } = require("./utils/errorhandling");

//view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  'hbs',
  hbs.engine({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: path.join(__dirname, 'views/layout/'),
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
      eq: (a, b) => a === b,
    },
  })
);
//viewing static pages
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

app.use((req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate");
  next();
});

// Initialize session before passport
app.use(
  session({
    secret: "abdchabsjvcadsjvhjcvadsj",
    saveUninitialized: false,
    resave: false,
  })
);

// app.use(flash());

// // Make flash messages available in templates
// app.use((req, res, next) => {
//   res.locals.success_msg = req.flash('success_msg');
//   res.locals.error_msg = req.flash('error_msg');
//   res.locals.error = req.flash('error');
//   next();
// });

app.use(passport.initialize());
app.use(passport.session());

app.use("/", userRouter);
app.use("/", adminRouter);

app.use((req, res) => {
  res.status(404).render("404");
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).send(err.stack);
});

app.listen(process.env.PORT, () => {
  console.log("server is running");
});

module.exports = app;
