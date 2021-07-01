const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();
const maxAge = 5;
const client = require("../functions/redis.js");
const {
  createToken,
  verificationAccessToken,
  verificationRefreshToken,
} = require("../controllers/authController");

const requireAuth = async (req, res, next) => {
  const token = req.cookies.jwt;
  const refresh_token = req.cookies.refresh_jwt;
  if (token && refresh_token) {
    try {
      let result = await verificationAccessToken(token);
      if (result === "jwt expired") {
        result = await verificationRefreshToken(refresh_token);
        if (result) {
          const token = createToken(result);
          res.cookie("jwt", token, {
            httpOnly: true,
          });
        }
      }
      next();
    } catch {
      res.locals.user = null;
      res.locals.key = "";
      res.cookie("jwt", "", { maxAge: 1 });
      res.cookie("refresh_jwt", "", { maxAge: 1 });
      res.redirect("/login");
    }
  } else {
    res.redirect("/login");
  }
};

const checkUser = async (req, res, next) => {
  const token = req.cookies.jwt;
  const refresh_token = req.cookies.refresh_jwt;
  if (token && refresh_token) {
    try {
      let result = await verificationAccessToken(token);
      if (result === "jwt expired") {
        result = await verificationRefreshToken(refresh_token);
        if (result) {
          const token = createToken(result);
          res.cookie("jwt", token, {
            httpOnly: true,
          });
        }
      }
      const user = await User.findById(result);
      res.locals.user = user;
      res.locals.key = user.api;
      next();
    } catch {
      res.locals.user = null;
      res.locals.key = "";
      res.cookie("jwt", "", { maxAge: 1 });
      res.cookie("refresh_jwt", "", { maxAge: 1 });
      next();
    }
  } else {
    next();
  }
};

const requireNoAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  const refresh_token = req.cookies.refresh_jwt;
  if (token && refresh_token) {
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
          next();
        }
      }
    );
  } else {
    next();
  }
};
module.exports = { requireAuth, checkUser, requireNoAuth };
