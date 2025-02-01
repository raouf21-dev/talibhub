// statisticsRoutes.js
const express = require("express");
const router = express.Router();
const { 
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getYearlyStats 
} = require("../controllers/statisticsController");
const { authenticateToken } = require('../middlewares/authenticateToken');

router.get("/daily", authenticateToken, getDailyStats);
router.get("/weekly", authenticateToken, getWeeklyStats);
router.get("/monthly", authenticateToken, getMonthlyStats);
router.get("/yearly", authenticateToken, getYearlyStats);

module.exports = router;