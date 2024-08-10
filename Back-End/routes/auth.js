const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

// Fonction d'inscription
router.post('/register', authController.register);

// Fonction de connexion
router.post('/login', authController.login);

// Middleware pour vérifier le token et obtenir l'ID de l'utilisateur
const authenticateToken = authController.authenticateToken;

// Endpoint pour récupérer les informations de profil
router.get('/profile', authenticateToken, authController.getProfile);

// Changer le mot de passe
router.post('/changePassword', authenticateToken, authController.changePassword);

module.exports = router;
