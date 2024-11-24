const express = require('express');
const authController = require('../controllers/authController');
const authenticateToken = authController.authenticateToken;

const router = express.Router();

// Fonction d'inscription
router.post('/register', authController.register);

// Fonction de connexion
router.post('/login', authController.login);

// Endpoint pour récupérer les informations de profil
router.get('/profile', authenticateToken, authController.getProfile);

// Changer le mot de passe
router.post('/changePassword', authenticateToken, authController.changePassword);


router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
