// routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authenticateToken');  // Changement ici

const router = express.Router();

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.get('/verify', authController.verify);

// Routes protégées
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/changePassword', authenticateToken, authController.changePassword);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;