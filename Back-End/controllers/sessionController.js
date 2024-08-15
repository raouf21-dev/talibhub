// controllers/sessionController.js
const sessionModel = require('../models/sessionModel');

exports.getAllSessions = async (req, res) => {
    try {
        const sessions = await sessionModel.getSessionsByUserId(req.user.id);
        res.json(sessions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.saveSession = async (req, res) => {
    const { id, taskId, previousSessionId, totalWorkTime, stopwatchTime, counterValue } = req.body;
    const userId = req.user.id;

    try {
        const session = await sessionModel.createSession(
            id,
            taskId,
            previousSessionId || null,
            userId,
            totalWorkTime,
            stopwatchTime,
            counterValue
        );
        res.status(201).json({ message: 'Session saved successfully', sessionId: session.id });
    } catch (err) {
        console.error('Error saving session:', err.message, err.stack);
        res.status(500).send('Server error');
    }
};

exports.getSessionById = async (req, res) => {
    const sessionId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    if (isNaN(sessionId)) {
        return res.status(400).json({ message: 'Invalid session ID' });
    }

    try {
        const session = await sessionModel.getSessionById(sessionId, userId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }
        res.json(session);
    } catch (err) {
        console.error('Error retrieving session:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getLastSession = async (req, res) => {
    try {
        const lastSession = await sessionModel.getLastSessionByUserId(req.user.id);
        if (!lastSession) {
            return res.status(404).json({ message: 'No previous session found' });
        }
        res.json(lastSession);
    } catch (err) {
        console.error('Error retrieving last session:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getLastSessionForTask = async (req, res) => {
    const taskId = parseInt(req.params.taskId, 10);
    const userId = req.user.id;

    console.log('Recherche de la dernière session - UserId:', userId, 'TaskId:', taskId);

    if (isNaN(taskId)) {
        return res.status(400).json({ message: 'Invalid Task ID' });
    }

    try {
        const lastSession = await sessionModel.getLastSessionByTaskId(userId, taskId);
        console.log('Dernière session trouvée:', lastSession);

        if (!lastSession) {
            console.log('Aucune session trouvée pour cette tâche');
            return res.status(404).json({ message: 'No previous session found for this task' });
        }
        res.json(lastSession);
    } catch (err) {
        console.error('Error retrieving last session for task:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};



