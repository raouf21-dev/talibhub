// models/sessionModel.js
const pool = require('../config/db');


const createSession = async (taskId, userId, totalWorkTime, stopwatchTime, timerTime, counterValue) => {
    try {
        const result = await pool.query(
            `INSERT INTO sessions (task_id, user_id, total_work_time, stopwatch_time, timer_time, counter_value) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [taskId, userId, totalWorkTime, stopwatchTime, timerTime, counterValue]
        );
        return result.rows[0];
    } catch (err) {
        console.error('Error in createSession:', err);
        throw err;
    }
};

// Fonction pour obtenir toutes les sessions d'un utilisateur
const getSessionsByUserId = async (userId) => {
    const result = await pool.query(
        'SELECT * FROM sessions WHERE user_id = $1 ORDER BY id DESC',
        [userId]
    );
    return result.rows;
};

const getNextTaskLastSessionId = async (userId, taskId) => {
    try {
        const result = await pool.query(
            `SELECT COALESCE(MAX(task_last_session_id), 0) + 1 as next_id
             FROM sessions
             WHERE user_id = $1 AND task_id = $2`,
            [userId, taskId]
        );
        return result.rows[0].next_id;
    } catch (err) {
        console.error('Error in getNextTaskLastSessionId:', err);
        throw err;
    }
};

// Fonction pour charger une session spécifique
const getSessionById = async (sessionId, userId) => {
    const result = await pool.query(
        'SELECT * FROM sessions WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
    );
    return result.rows[0];
};

// Dans votre fichier sessionModel.js
const getLastSessionByTaskId = async (userId, taskId) => {
    console.log(`Querying last session for user ${userId} and task ${taskId}`);
    const result = await pool.query(
        `SELECT * FROM sessions 
         WHERE user_id = $1 AND task_id = $2 
         ORDER BY created_at DESC LIMIT 1`,
        [userId, taskId]
    );
    console.log('Query result:', result.rows[0]);
    return result.rows[0];
};

const updateSession = async (sessionId, totalWorkTime, stopwatchTime, timerTime, counterValue) => {
    const result = await pool.query(
        `UPDATE sessions 
        SET total_work_time = $2, stopwatch_time = $3, timer_time = $4, counter_value = $5
        WHERE id = $1 RETURNING *`,
        [sessionId, totalWorkTime, stopwatchTime, timerTime, counterValue]
    );
    return result.rows[0];
};

const getSessionCountByTaskId = async (userId, taskId) => {
    const result = await pool.query(
        'SELECT COUNT(*) FROM sessions WHERE user_id = $1 AND task_id = $2',
        [userId, taskId]
    );
    return parseInt(result.rows[0].count);
};


module.exports = {
    getSessionsByUserId,
    createSession,
    getSessionById,
    //getLastSessionByUserId,
    getLastSessionByTaskId,
    getNextTaskLastSessionId,
    getSessionCountByTaskId,
};
