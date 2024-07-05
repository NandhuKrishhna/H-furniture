const express = require("express");
const app = express();
const session = require("express-session");
const hbs = require("express-handlebars");
const path = require("path");
const db = require("./config/db");
const cookieParser = require("cookie-parser");
db();
require("dotenv").config();




// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());


const userRouter = require("./routes/userRouter");
// const adminRouter = require("./routes/adminRouter")


//view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: path.join(__dirname, "/views/layout/"),
    partialsDir: path.join(__dirname, "/views/partials"),
  })
);


//viewing static pages
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate");
  next();
});



app.use(
  session({
    secret: "abdchabsjvcadsjvhjcvadsj",
    saveUninitialized: true,
    resave: false,
  })
);


// app.use("/", adminRoute);
app.use("/", userRouter);
// app.use("/",adminRouter)






app.listen(process.env.PORT, () => {
  console.log("server is running");
});
