const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken'); // Assurez-vous que l'authentification est bien gérée
const sourateController = require('../controllers/sourateController');

router.get('/', authenticateToken, sourateController.getAllSourates);
router.get('/known', authenticateToken, sourateController.getKnownSourates);
router.post('/known', authenticateToken, sourateController.saveKnownSourates);
router.post('/select', authenticateToken, sourateController.selectRandomSourates);
router.get('/history', authenticateToken, sourateController.getRecitationHistory); // Ajoutez cette ligne si elle n'existe pas
router.get('/stats', authenticateToken, sourateController.getRecitationStats);
router.get('/recitation-info', authenticateToken, sourateController.getRecitationInfo);


module.exports = router;
