const express = require('express');
const tasksController = require('../controllers/tasksController');
const authController = require('../controllers/authController');
const router = express.Router();


// Middleware pour vérifier le token et obtenir l'ID de l'utilisateur
const authenticateToken = authController.authenticateToken;

// Obtenir toutes les tâches
router.get('/getAllTasks', authenticateToken, tasksController.getAllTasks);

// Ajouter une nouvelle tâche
router.post('/addTask', authenticateToken, tasksController.addTask);

// Supprimer une tâche
router.delete('/deleteTask/:id', authenticateToken, tasksController.deleteTask);

// Renommer une tâche
router.put('/updateTask/:id', authenticateToken, tasksController.updateTask);

module.exports = router;
