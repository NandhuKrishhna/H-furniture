require('dotenv').config();

const express = require("express");
const app = express();
const session = require('express-session');
const path = require("path");
const db = require("./config/db");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const passport = require("./config/passport");
const expressLayouts = require('express-ejs-layouts');
const jwt = require("jsonwebtoken");
const Userdb = require("./models/UserModels");
const sweetalert = require('sweetalert2');
const logger = require('morgan');
const PDFDocument = require('pdfkit');

// Connect to the database
db();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(logger('dev'));

app.use((req, res, next) => {
  res.locals.searchTerm = req.query.search || ''; 
  next();
});

// Routes
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");

// View engine setup
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout'); 

// Serving static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));
app.use('/json', express.static(path.join(__dirname, 'json')));

// Cache control middleware
app.use((req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate");
  next();
});

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
}));




// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());


// Use routes
app.use("/", userRouter);
app.use("/", adminRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).render("404", {
    errorMessage: "Oops! Page Not Found",
    errorDescription: "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable."
  });
});


app.use((req, res, next) => {
  console.log('Incoming Request Data:', req.body);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("500", {
    errorMessage: "Something went wrong!",
    errorDescription: "An unexpected error occurred. Please try again later."
  });
});


const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;