const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] },
      (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          res.redirect("/login");
        } else {
          console.log(decodedToken);
          next();
        }
      }
    );
  } else {
    res.redirect("/login");
  }
};
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] },
      async (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          res.locals.user = null;
          res.locals.key = "";
          next();
        } else {
          let user = await User.findById(decodedToken.id);
          res.locals.user = user;
          res.locals.key = user.api;
          next();
        }
      }
    );
  } else {
    res.locals.user = null;
    res.locals.key = "";
    next();
  }
};
const requireNoAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] },
      (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          next();
        } else {
          console.log(decodedToken);
          res.redirect("/");
        }
      }
    );
  } else {
    next();
  }
};
module.exports = { requireAuth, checkUser, requireNoAuth };
