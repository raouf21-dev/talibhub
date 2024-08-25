const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const timerController = require('../controllers/timerController');

// Sauvegarder l'état du timer
router.post('/saveState', authenticateToken, timerController.saveTimerState);

// Charger l'état du timer
router.get('/loadState', authenticateToken, timerController.loadTimerState);

// Ajouter une tâche complétée
router.post('/completedTasks', authenticateToken, timerController.addCompletedTask);

module.exports = router;
