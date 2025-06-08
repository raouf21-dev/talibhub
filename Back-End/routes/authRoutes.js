// routes/authRoutes.js
const express = require("express");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/authenticateToken");

const router = express.Router();

// Routes publiques
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);
router.get("/verify", authController.verify);

// Nouvelle route pour demander la réinitialisation du mot de passe
router.post("/forgot-password", authController.forgotPassword);

// Routes pour la réinitialisation du mot de passe
router.get("/reset-password/:token", authController.getResetPassword);
router.post("/reset-password/:token", authController.resetPassword);

// Routes protégées
router.get("/profile", authenticateToken, authController.getProfile);
router.post(
  "/changePassword",
  authenticateToken,
  authController.changePassword
);
router.post("/logout", authenticateToken, authController.logout);

module.exports = router;
