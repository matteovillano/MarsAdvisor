const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const cookieParser = require("cookie-parser");

router.use(express.json());
router.use(
  express.urlencoded({
    extended: true,
  })
);

router.use(cookieParser());

const { requireNoAuth } = require("../middleware/authMiddleware"); //carica la funzione che cerca di non far entrare nella pagina di login/register se l'utente è già loggato

router.get("/signup", requireNoAuth, authController.signup_get);
router.post("/signup", requireNoAuth, authController.signup_post);
router.get("/login", requireNoAuth, authController.login_get);
router.post("/login", requireNoAuth, authController.login_post);
router.get("/logout", authController.logout_get);

router.get(
  "/forgotPassword",
  requireNoAuth,
  authController.forgot_password_get
);
router.post(
  "/forgotPassword",
  requireNoAuth,
  authController.forgot_password_post
);
router.get(
  "/resetPassword/:token",
  requireNoAuth,
  authController.reset_password_get
);
router.patch(
  "/resetPassword/:token",
  requireNoAuth,
  authController.reset_password_patch
);

/*router.patch(
  "/updatePassword",
  checkUser,
  authController.update_password_patch //ancora da implementare
);*/

module.exports = router;
