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

// Initialize app
const app = express();

// Connect to database
db();

// ========================
// 1. CORE MIDDLEWARE
// ========================

// Enhanced logging setup
// app.use(logger(':method :url :status - :response-time ms - [User-Agent] :user-agent'));

// Security middleware
app.use(nocache());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'))

// Cookie and method override
app.use(cookieParser());
app.use(methodOverride("_method"));

// ========================
// 2. STATIC ASSETS
// ========================
// app.get("/", (req, res) => res.send("hello world")); // Fixed typo
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========================
// 3. SESSION & AUTH
// ========================
app.use(session({
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

// ========================
// 4. VIEW ENGINE
// ========================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Template locals
app.use((req, res, next) => {
  res.locals.searchTerm = req.query.search || '';
  res.locals.user = req.user; // Make user available in templates
  next();
});

// ========================
// 5. ROUTES
// ========================
// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root route (keep this before other routers)

// Other routes
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");
app.use(userRouter);
app.use(adminRouter);

// ========================
// 6. ERROR HANDLERS
// ========================
// 404 Handler
app.use((req, res) => {
  res.status(404).render("404", {
    errorMessage: "Oops! Page Not Found",
    errorDescription: "The page you're looking for might have been removed or temporarily unavailable."
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}`, err.stack);
  res.status(500).render("500", {
    errorMessage: "Something went wrong!",
    errorDescription: "Our team has been notified. Please try again later."
  });
});

// ========================
// SERVER START
// ========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🕒 ${new Date().toLocaleString()}`);
});

module.exports = app;
