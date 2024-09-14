const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken'); // Assurez-vous que l'authentification est bien gérée
const sourateController = require('../controllers/sourateController');



// Routes pour les sourates
router.get('/', authenticateToken, sourateController.getAllSourates);
router.get('/known', authenticateToken, sourateController.getKnownSourates);
router.post('/known', authenticateToken, sourateController.updateKnownSourates);

// Routes pour les récitations
router.post('/recitations', authenticateToken, sourateController.recordRecitation);
router.get('/recitations/stats', authenticateToken, sourateController.getRecitationStats);
router.get('/recitations/history', authenticateToken, sourateController.getRecitationHistory);
router.get('/recitations/info', authenticateToken, sourateController.getRecitationInfo);

module.exports = router;
