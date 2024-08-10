// controllers/sessionController.js
const Session = require('../models/sessionModel');

// Fonction pour sauvegarder une session
exports.saveSession = (req, res) => {
    Session.sessions.push(req.body);
    res.json({ message: 'Session saved successfully' });
};

// Fonction pour charger les sessions
exports.loadSessions = (req, res) => {
    res.json(Session.sessions);
};
