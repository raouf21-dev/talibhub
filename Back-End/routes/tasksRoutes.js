// routes/tasksRoutes.js
const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');
const { authenticateToken } = require('../middlewares/authenticateToken');  // Destructuration de l'objet importé

// Routes
router.get('/getAllTasks', authenticateToken, tasksController.getAllTasks);
router.post('/addTask', authenticateToken, tasksController.addTask);
router.delete('/deleteTask/:id', authenticateToken, tasksController.deleteTask);
router.put('/updateTask/:id', authenticateToken, tasksController.updateTask);

module.exports = router;