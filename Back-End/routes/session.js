// routes/sessionRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const sessionController = require('../controllers/sessionController');

router.get('/load', authenticateToken, sessionController.getAllSessions);
router.post('/save', authenticateToken, sessionController.saveSession);
router.get('/:id', authenticateToken, sessionController.getSessionById);
router.get('/last/:taskId', authenticateToken, sessionController.getLastSessionForTask);


module.exports = router;
