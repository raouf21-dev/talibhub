const pool = require('../config/db');

const getAllSourates = async () => {
    const { rows } = await pool.query('SELECT * FROM sourates ORDER BY number');
    return rows;
};

const getKnownSourates = async (userId) => {
    const { rows } = await pool.query('SELECT sourate_number FROM known_sourates WHERE user_id = $1', [userId]);
    return rows.map(row => row.sourate_number);
};

const saveKnownSourates = async (userId, sourates) => {
    await pool.query('DELETE FROM known_sourates WHERE user_id = $1', [userId]);
    const queryText = 'INSERT INTO known_sourates (user_id, sourate_number) VALUES ($1, $2)';
    for (const sourate of sourates) {
        await pool.query(queryText, [userId, sourate]);
    }
};

module.exports = {
    getAllSourates,
    getKnownSourates,
    saveKnownSourates
};
