require("dotenv").config();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const maxAge = 3 * 24 * 60 * 60;

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};
const createApi = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports.signup_get = (req, res) => {
  res.render("signup");
};

module.exports.login_get = (req, res) => {
  res.render("login");
};

module.exports.signup_post = async (req, res) => {
  const { username, email, password } = req.body;
  const api = createApi();
  try {
    const user = await User.create({
      username,
      email,
      password,
      api,
    });
    console.log("User created successfully: ", user);
    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.json({ status: "ok" });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ status: "error", error: "Username already in use" });
    }
    throw error;
  }
};

module.exports.login_post = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.login(username, password);
    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.json({ status: "ok" });
  } catch (error) {
    res.json({ error: "user o login sbagliata" });
  }
};
module.exports.logout_get = async (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/");
};
module.exports.forgot_password_get = async (req, res) => {
  res.render("forgot");
};

module.exports.forgot_password_post = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      const resetToken = user.createPasswordResetToken();
      await user.save();
      console.log(JSON.stringify(resetToken));
      const resetURL = `${
        process.env.NODE_ENV !== "production" ? "http" : "https"
      }://${req.get("host")}/resetPassword/${resetToken}`;
      const from = `bocancea.1764205@studenti.uniroma1.it`;
      const to = user.email;
      const subject = "MARS ADVISOR ACCOUNT RESET PASSWORD";
      const html = `<a href="${resetURL}"> Clicca qui per resettare la tua password MarsAdvisor</a>`;
      console.log(user.passwordResetToken);
      sendEmail(to, from, subject, html);
      res.json({ status: "email inviata" });
    } else {
      res.json({ error: "utente con questa email non trovato" });
    }
  } catch {
    res.json({ error: "errore email non trovata" });
  }
};
module.exports.reset_password_get = async (req, res) => {
  res.render("reset");
};
module.exports.reset_password_patch = async (req, res) => {
  const { password } = req.body;
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (user && password) {
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.passwordHashed = false;
      await user.save();
      console.log(user);
      res.json({ status: "ok" });
    } else {
      res.json({ error: "errore reset password" });
    }
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json({ error: "errore reset password" });
  }
};
module.exports.update_password_patch = async (req, res, next) => {
  const token = req.cookies.jwt;
  const password = req.body.password;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.locals.user = null;
        next();
      } else {
        if (password) {
          let user = await User.findById(decodedToken.id);
          user.password = password;
          res.redirect("/user");
        } else {
          res.json({ error: "errore update password" });
        }
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};
