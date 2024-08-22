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
    const { taskId, totalWorkTime, stopwatchTime, timerTime, counterValue } = req.body;
    const userId = req.user.id;

    try {
        const newSession = await sessionModel.createSession(
            taskId,
            userId,
            totalWorkTime,
            stopwatchTime,
            timerTime,
            counterValue
        );
        res.status(201).json({ 
            message: 'Session saved successfully', 
            newSessionId: newSession.id
        });
    } catch (err) {
        console.error('Error in saveSession:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
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

    console.log(`Getting last session for user ${userId} and task ${taskId}`);

    try {
        const lastSession = await sessionModel.getLastSessionByTaskId(userId, taskId);
        const sessionCount = await sessionModel.getSessionCountByTaskId(userId, taskId);

        console.log('Last session found:', lastSession);
        console.log('Session count:', sessionCount);

        if (!lastSession) {
            console.log('No previous session found for this task');
            return res.status(200).json({
                message: 'No previous session found for this task',
                lastSession: {
                    counter_value: 0,
                    total_work_time: 0,
                    stopwatch_time: 0,
                    timer_time: 0
                },
                sessionCount: 0
            });
        }

        // Ajoutez ces logs juste avant d'envoyer la réponse
        console.log('Sending response:', {
            message: 'Last session found',
            lastSession: {
                counter_value: lastSession.counter_value,
                total_work_time: lastSession.total_work_time,
                stopwatch_time: lastSession.stopwatch_time,
                timer_time: lastSession.timer_time
            },
            sessionCount: sessionCount
        });

        res.json({
            message: 'Last session found',
            lastSession: {
                counter_value: lastSession.counter_value,
                total_work_time: lastSession.total_work_time,
                stopwatch_time: lastSession.stopwatch_time,
                timer_time: lastSession.timer_time
            },
            sessionCount: sessionCount
        });
    } catch (err) {
        console.error('Error retrieving last session for task:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

