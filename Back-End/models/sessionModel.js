// models/sessionModel.js
const pool = require('../config/db');

// Fonction pour obtenir toutes les sessions d'un utilisateur
const getSessionsByUserId = async (userId) => {
    const result = await pool.query(
        'SELECT * FROM sessions WHERE user_id = $1 ORDER BY id DESC',
        [userId]
    );
    return result.rows;
};

// Fonction pour créer une nouvelle session
const createSession = async (id, taskId, previousSessionId, userId, totalWorkTime, stopwatchTime, counterValue) => {
    const result = await pool.query(
        `INSERT INTO sessions (id, task_id, previous_session_id, user_id, total_work_time, stopwatch_time, counter_value) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [id, taskId, previousSessionId || 0, userId, totalWorkTime, stopwatchTime, counterValue]
    );
    return result.rows[0];
};



// Fonction pour charger une session spécifique
const getSessionById = async (sessionId, userId) => {
    const result = await pool.query(
        'SELECT * FROM sessions WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
    );
    return result.rows[0];
};

const getLastSessionByUserId = async (userId) => {
    const result = await pool.query(
        'SELECT * FROM sessions WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
        [userId]
    );
    return result.rows[0];
};

const getLastSessionByTaskId = async (userId, taskId) => {
    console.log('Exécution de la requête SQL - UserId:', userId, 'TaskId:', taskId);
    const result = await pool.query(
        'SELECT * FROM sessions WHERE user_id = $1 AND task_id = $2 ORDER BY id DESC LIMIT 1',
        [userId, taskId]
    );
    console.log('Résultat de la requête SQL:', result.rows);
    return result.rows[0];
};

const updateSession = async (sessionId, totalWorkTime, stopwatchTime, counterValue) => {
    const result = await pool.query(
        `UPDATE sessions 
        SET total_work_time = $2, stopwatch_time = $3, counter_value = $4
        WHERE id = $1 RETURNING *`,
        [sessionId, totalWorkTime, stopwatchTime, counterValue]
    );
    return result.rows[0];
};


module.exports = {
    getSessionsByUserId,
    createSession,
    getSessionById,
    getLastSessionByUserId,
    getLastSessionByTaskId
};
