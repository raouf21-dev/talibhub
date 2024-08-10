const pool = require('../config/db');

const getTasksByUserId = async (userId) => {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
    return result.rows;
};

const createTask = async (name, userId) => {
    const result = await pool.query('INSERT INTO tasks (name, user_id) VALUES ($1, $2) RETURNING *', [name, userId]);
    return result.rows[0];
};

const deleteTask = async (taskId, userId) => {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [taskId, userId]);
    return result.rows[0];
};

const updateTask = async (taskId, userId, name) => {
    const result = await pool.query(
        'UPDATE tasks SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [name, taskId, userId] // Assurez-vous que taskId est un entier
    );
    return result.rows[0];
};

module.exports = {
    getTasksByUserId,
    createTask,
    deleteTask,
    updateTask,
};
