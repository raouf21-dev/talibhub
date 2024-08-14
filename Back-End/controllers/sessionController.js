// controllers/sessionController.js
const Session = require('../models/sessionModel');
const Joi = require('joi');

const sessionSchema = Joi.object({
    taskId: Joi.number().integer().required(),
    previousSessionId: Joi.number().integer().allow(null),
    totalWorkTime: Joi.number().integer().min(0).required(),
    stopwatchTime: Joi.number().integer().min(0).required(),
    counterValue: Joi.number().integer().min(0).required()
});

exports.saveSession = async (req, res) => {
    const { error } = sessionSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { taskId, previousSessionId, totalWorkTime, stopwatchTime, counterValue } = req.body;
    const userId = req.user.id;

    try {
        await pool.query(
            `INSERT INTO sessions (task_id, previous_session_id, user_id, total_work_time, stopwatch_time, counter_value) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [taskId, previousSessionId, userId, totalWorkTime, stopwatchTime, counterValue]
        );
        res.json({ message: 'Session saved successfully' });
    } catch (err) {
        console.error('Error saving session:', err);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde de la session' });
    }
};

exports.loadSessions = async (req, res) => {
    try {
        const { userId } = req.user; // Assurez-vous que l'utilisateur est authentifié
        const result = await pool.query(
            `SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error loading sessions:', err);
        res.status(500).json({ error: 'Erreur lors du chargement des sessions' });
    }
};


