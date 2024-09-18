// surahMemorizationRoutes.js
const express = require('express');
const router = express.Router();
const surahMemorizationController = require('../controllers/surahMemorizationControllers');
const authenticateToken = require('../middleware/authenticateToken');

// Routes
router.get('/surahs', authenticateToken, surahMemorizationController.getSurahs);
router.post('/surahs/:number', authenticateToken, surahMemorizationController.updateSurah);
router.get('/history', authenticateToken, surahMemorizationController.getHistory);
router.delete('/history', authenticateToken, surahMemorizationController.clearHistory);
router.post('/known', authenticateToken, surahMemorizationController.saveKnownSurahs);

module.exports = router;
