//userModel.js

const pool = require('../config/db');
const bcrypt = require('bcrypt');

const getUserByUsername = async (username) => {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
};

const getUserByEmail = async (email) => {
    console.log('getUserByEmail appelé avec:', email);
    
    try {
        // Log de la requête SQL
        const query = {
            text: 'SELECT * FROM users WHERE email = $1',
            values: [email]
        };
        console.log('Requête SQL:', query);

        const result = await pool.query(query);
        console.log('Résultat requête:', result.rows);
        
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

module.exports = {
    getUserByUsername,
    getUserByEmail,
    getUserByUsername,
    createUser,
    getUserById,
    updateUserPassword,
};
