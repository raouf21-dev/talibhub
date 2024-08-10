const pool = require('../config/db');
const bcrypt = require('bcrypt');

const getUserByUsername = async (username) => {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
};

const getUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
};

const createUser = async (username, password, email) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *',
        [username, hashedPassword, email]
    );
    return result.rows[0];
};

const getUserById = async (id) => {
    const result = await pool.query('SELECT username, last_name, first_name, age, gender, email FROM users WHERE id = $1', [id]);
    return result.rows[0];
};

const updateUserPassword = async (id, newPassword) => {
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, id]);
};

module.exports = {
    getUserByUsername,
    getUserByEmail,
    createUser,
    getUserById,
    updateUserPassword,
};
