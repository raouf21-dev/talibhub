const pool = require('../config/db');
const Timer = require('../models/timerModel');

// Fonction pour charger l'état du timer
exports.loadTimerState = (req, res) => {
    res.json(Timer.state);
};

// Fonction pour sauvegarder l'état du timer
exports.saveTimerState = (req, res) => {
    Timer.state = req.body;
    res.json({ message: 'Timer state saved successfully' });
};

// Fonction pour sauvegarder une session
exports.saveSession = (req, res) => {
    Timer.sessions.push(req.body);
    res.json({ message: 'Session saved successfully' });
};

// Fonction pour ajouter une tâche complétée
exports.addCompletedTask = (req, res) => {
    const task = req.body;
    Timer.sessions.push(task);
    res.json({ message: 'Task added successfully' });
};


