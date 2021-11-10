require("dotenv").config();
const express = require("express");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

app.set("view engine", "ejs");
app.use(express.static("Public"));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const usersSchema = new Schema({
  email: String,
  password: String,
  secret: String,
});

usersSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", usersSchema);
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

app.get("/secrets", function (req, res) {
  User.find({ secret: { $ne: null } }, function (err, users) {
    if (!err) {
      if (users) {
        res.render("secrets", { secrets: users });
      }
    } else {
      res.redirect("/login");
    }
  });
});

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(user, function (err) {
    if (!err) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    } else {
      console.log(err);
      res.send(err);
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  const userName = req.body.username;
  const password = req.body.password;

  User.register({ username: userName }, password, function (err, user) {
    if (!err) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    } else {
      res.redirect("/redirect");
    }
  });
});

app.get("/submit", function (req, res) {
  if (!req.isAuthenticated) {
    res.redirect("/login");
  } else {
    res.render("submit");
  }
});

app.post("/submit", function (req, res) {
  const secret = req.body.secret;

  User.findById(req.user.id, function (err, user) {
    if (!err) {
      if (user) {
        user.secret = secret;
        user.save(function (err) {
          if (!err) {
            res.redirect("/secrets");
          } else {
            res.send(err);
          }
        });
      }
    } else {
      res.send(err);
    }
  });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
