const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const authenticateToken = require('../middleware/authenticateToken');

router.get('/daily', authenticateToken, statisticsController.getDailyStats);
router.get('/weekly', authenticateToken, statisticsController.getWeeklyStats);
router.get('/monthly', authenticateToken, statisticsController.getMonthlyStats);
router.get('/yearly', authenticateToken, statisticsController.getYearlyStats);

module.exports = router;