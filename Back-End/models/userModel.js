// models/userModel.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

const getUserByUsername = async (username) => {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
};

const getUserByEmail = async (email) => {
    try {
        const query = {
            text: 'SELECT * FROM users WHERE email = $1',
            values: [email]
        };
        const result = await pool.query(query);
        return result.rows[0];
    } catch (error) {
        console.error('Erreur dans getUserByEmail:', error);
        throw error;
    }
};

const createUser = async (username, password, email, firstName, lastName, age, gender, country) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        `INSERT INTO users (username, password, email, first_name, last_name, age, gender, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [username, hashedPassword, email, firstName, lastName, age, gender, country]
    );
    return result.rows[0];
};

const getUserById = async (id) => {
    const result = await pool.query(
        'SELECT id, username, email, first_name, last_name, age, gender FROM users WHERE id = $1',
        [id]
    );
    return result.rows[0];
};

const updateUserPassword = async (id, newPassword) => {
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, id]);
};

// Fonctions pour la réinitialisation du mot de passe

const setResetToken = async (userId, token, expires) => {
    await pool.query(
        'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
        [token, expires, userId]
    );
};

const getUserByResetToken = async (token) => {
    const result = await pool.query(
        'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
        [token]
    );
    return result.rows[0];
};

const clearResetToken = async (userId) => {
    await pool.query(
        'UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1',
        [userId]
    );
};

module.exports = {
    getUserByUsername,
    getUserByEmail,
    createUser,
    getUserById,
    updateUserPassword,
    setResetToken,
    getUserByResetToken,
    clearResetToken
};
