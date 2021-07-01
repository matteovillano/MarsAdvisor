require("dotenv").config();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const maxAge = 5;
const maxRefreshAge = 3 * 24 * 60 * 60;
const client = require("../functions/redis.js");

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

function verificationAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] },
      (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          if (err.message == "jwt expired") {
            return resolve("jwt expired");
          }
          return reject();
        }
        return resolve(decodedToken.id);
      }
    );
  });
}
function verificationRefreshToken(refresh_token) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      refresh_token,
      process.env.JWT_REFRESH_SECRET,
      { algorithms: ["HS256"] },
      (e, decodedRefreshToken) => {
        if (e) {
          console.log(e.message);
          return reject();
        } else {
          console.log("Stampo decodedRefreshToken.id");
          console.log(decodedRefreshToken.id);
          let userId = decodedRefreshToken.id.toString();
          client.GET(userId, (err, token) => {
            if (err) {
              console.log("errore get redis token");
              reject();
              return;
            }
            if (refresh_token == token) {
              return resolve(decodedRefreshToken.id);
            }
            return reject();
          });
        }
      }
    );
  });
}
function createRefreshToken(id) {
  return new Promise((resolve, reject) => {
    console.log("prima di formazione token");
    const refresh_token = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: maxRefreshAge,
    });
    console.log("dopo formazione token");
    const utente = id.toString();
    console.log(utente);
    client.SET(utente, refresh_token, "EX", maxRefreshAge, (err, reply) => {
      if (err) {
        return reject(err.message);
      }
      resolve(refresh_token);
    });
  });
}

const createApi = () => {
  return crypto.randomBytes(32).toString("hex");
};

const signup_get = (req, res) => {
  res.render("signup");
};

const login_get = (req, res) => {
  res.render("login");
};

const signup_post = async (req, res) => {
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
    const refreshToken = await createRefreshToken(user._id);
    console.log(refreshToken);
    res.cookie("refresh_jwt", refreshToken, {
      httpOnly: true,
      maxAge: maxRefreshAge * 1000,
    });
    res.cookie("jwt", token, { httpOnly: true });
    res.json({ status: "ok" });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ status: "error", error: "Username already in use" });
    }
    throw error;
  }
};

const login_post = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.login(username, password);
    const token = createToken(user._id);
    const refreshToken = await createRefreshToken(user._id);
    console.log(refreshToken);
    res.cookie("refresh_jwt", refreshToken, {
      httpOnly: true,
      maxAge: maxRefreshAge * 1000,
    });
    res.cookie("jwt", token, { httpOnly: true });
    res.json({ status: "ok" });
  } catch (error) {
    res.json({ error: "user o login sbagliata" });
  }
};
const logout_get = async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_jwt;
    const userId = await verificationRefreshToken(refresh_token);
    client.DEL(userId, (err, value) => {
      if (err) {
        console.log(err.message);
        throw err;
      }
      res.cookie("jwt", "", { maxAge: 1 });
      res.cookie("refresh_jwt", "", { maxAge: 1 });
      res.redirect("/");
    });
  } catch (e) {
    console.log("errore logout");
    res.cookie("jwt", "", { maxAge: 1 });
    res.cookie("refresh_jwt", "", { maxAge: 1 });
    res.redirect("/");
  }
};
const forgot_password_get = async (req, res) => {
  res.render("forgot");
};

const forgot_password_post = async (req, res) => {
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
const reset_password_get = async (req, res) => {
  res.render("reset");
};
const reset_password_patch = async (req, res) => {
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
module.exports = {
  verificationRefreshToken,
  verificationAccessToken,
  createToken,
  signup_get,
  login_get,
  signup_post,
  login_post,
  logout_get,
  forgot_password_get,
  forgot_password_post,
  reset_password_get,
  reset_password_patch,
};
/*module.exports.update_password_patch = async (req, res, next) => {
  const token = req.cookies.jwt;
  const password = req.body.password;
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
          if (password) {
            let user = await User.findById(decodedToken.id);
            user.password = password;
            res.redirect("/user");
          } else {
            res.json({ error: "errore update password" });
          }
        }
      }
    );
  } else {
    res.locals.user = null;
    res.locals.key = "";
    next();
  }
};*/
