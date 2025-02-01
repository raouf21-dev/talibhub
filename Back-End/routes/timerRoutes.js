// routes/timerRoutes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require('../middlewares/authenticateToken');
const timerController = require("../controllers/timerController");

// Routes timer
router.get("/loadState", authenticateToken, timerController.loadTimerState);
router.post("/saveState", authenticateToken, timerController.saveTimerState);
router.post("/completedTasks", authenticateToken, timerController.addCompletedTask);

module.exports = router;