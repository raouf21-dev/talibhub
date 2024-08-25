const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken'); // Assurez-vous que l'authentification est bien gérée
const sourateController = require('../controllers/sourateController');

router.get('/', authenticateToken, sourateController.getAllSourates);
router.get('/known', authenticateToken, sourateController.getKnownSourates);
router.post('/known', authenticateToken, sourateController.saveKnownSourates);

module.exports = router;
