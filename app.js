if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dbURL = process.env.ATLASDB_URL;

const port = 3000;
const path = require("path"); // Setting path
const methodOverride = require("method-override"); // Patch, Put, Delete handling
const ejsMate = require("ejs-mate"); // Templating
const ExpressError = require("./utils/ExpressError.js"); // Error handling
const session = require("express-session"); // Cookies
const MongoStore = require("connect-mongo");
const flash = require("connect-flash"); //Flashing msg
const passport = require("passport"); // Authenticate
const LocalStrategy = require("passport-local"); // Authenticate
const User = require("./models/user.js"); // Authenticate

//Router Setup
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.set("view engine", "ejs"); // Templating
app.set("views", path.join(__dirname, "views")); // Template path
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

//DB setup
main()
  .then(() => {
    console.log("Connection Successful");
  })
  .catch((err) => {
    console.log(err);
  });
``;
async function main() {
  await mongoose.connect(dbURL);
}

const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

//Setting up the session options
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, //In Milliseconds
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

//Home Route
// app.get("/", (req, res) => {
//   res.send("Root's Working");
// });

//Setting up the session
app.use(session(sessionOptions));

//Setting flash
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Middleware to Define locals
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

//Using listings, Reviews, User
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", userRouter);

//Global Error
app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

//Global error
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went Wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message });
  // res.status(statusCode).send(message);
});

//Listening to Port
app.listen(port, () => {
  console.log("Server Listening: 3000");
});
