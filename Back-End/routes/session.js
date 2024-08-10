// routes/session.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const sessionController = require('../controllers/sessionController');

// Route pour sauvegarder une session
router.post('/save', authenticateToken, sessionController.saveSession);

// Route pour charger les sessions
router.get('/load', authenticateToken, sessionController.loadSessions);

module.exports = router;
