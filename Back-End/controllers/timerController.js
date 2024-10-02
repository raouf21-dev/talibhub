// timerController.js

const pool = require('../config/db'); // Assurez-vous que db.js est correctement configuré
const Timer = require('../models/timerModel');

// Fonction pour charger l'état du timer
const loadTimerState = (req, res) => {
    res.json(Timer.state);
};

// Fonction pour sauvegarder l'état du timer
const saveTimerState = (req, res) => {
    Timer.state = req.body;
    res.json({ message: 'Timer state saved successfully' });
};

// Fonction pour sauvegarder une session
const saveSession = (req, res) => {
    Timer.sessions.push(req.body);
    res.json({ message: 'Session saved successfully' });
};

// Fonction pour ajouter une tâche complétée
const addCompletedTask = (req, res) => {
    const task = req.body;
    Timer.sessions.push(task);
    res.json({ message: 'Task added successfully' });
};

// Exporter toutes les fonctions
module.exports = {
    loadTimerState,
    saveTimerState,
    saveSession,
    addCompletedTask,
};
