const pool = require('../config/db');

const getAllSourates = async () => {
    const { rows } = await pool.query('SELECT * FROM sourates ORDER BY number');
    return rows;
};

const getKnownSourates = async (userId) => {
    const { rows } = await pool.query('SELECT sourate_number, recitation_count FROM known_sourates WHERE user_id = $1', [userId]);
    return rows;
};

const saveKnownSourates = async (userId, sourates) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Supprimer les anciennes entrées
        await client.query('DELETE FROM known_sourates WHERE user_id = $1', [userId]);

        // Insérer les nouvelles entrées avec une initialisation
        const insertQuery = `
            INSERT INTO known_sourates (user_id, sourate_number, recitation_count, last_recited)
            VALUES ($1, $2, 0, CURRENT_TIMESTAMP)
        `;
        for (const sourate of sourates) {
            await client.query(insertQuery, [userId, sourate]);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updateRecitationCount = async (userId, firstSourate, secondSourate) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Mettre à jour le compteur de récitation pour les deux sourates
        const updateQuery = `
            UPDATE known_sourates 
            SET recitation_count = recitation_count + 1, last_recited = CURRENT_TIMESTAMP 
            WHERE user_id = $1 AND sourate_number = $2
        `;
        await client.query(updateQuery, [userId, firstSourate]);
        await client.query(updateQuery, [userId, secondSourate]);

        // Vérifier si un nouveau cycle est complété
        const { rows } = await client.query(`
            SELECT MIN(recitation_count) as min_count
            FROM known_sourates
            WHERE user_id = $1
        `, [userId]);

        let cycleCompleted = false;
        if (rows[0].min_count > 0) {
            // Réinitialiser les compteurs de récitation si un cycle est complet
            await client.query(`
                UPDATE known_sourates
                SET recitation_count = 0
                WHERE user_id = $1
            `, [userId]);
            cycleCompleted = true;
        }

        await client.query('COMMIT');
        return cycleCompleted;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getRecitationCycles = async (userId) => {
    const { rows } = await pool.query(`
        SELECT complete_cycles
        FROM user_recitation_stats
        WHERE user_id = $1
    `, [userId]);
    return rows[0] ? rows[0].complete_cycles : 0;
};

const getRecitationProgress = async (userId) => {
    const { rows } = await pool.query(`
        SELECT 
            COUNT(*) as total_known,
            COUNT(CASE WHEN recitation_count > 0 THEN 1 END) as recited_at_least_once
        FROM known_sourates
        WHERE user_id = $1
    `, [userId]);
    return rows[0];
};

const getRecitationHistory = async (userId) => {
    const { rows } = await pool.query(`
        SELECT sourate_number, recitation_count, last_recited
        FROM known_sourates
        WHERE user_id = $1
        ORDER BY last_recited DESC
    `, [userId]);
    return rows;
};

const getRecitationStats = async (userId) => {
    const { rows } = await pool.query(`
        SELECT 
            COUNT(*) as total_known,
            COUNT(CASE WHEN recitation_count > 0 THEN 1 END) as recited_at_least_once,
            MIN(recitation_count) as min_recitations
        FROM known_sourates
        WHERE user_id = $1
    `, [userId]);
    return rows[0];
};

module.exports = {
    getAllSourates,
    getKnownSourates,
    saveKnownSourates,
    updateRecitationCount,
    getRecitationCycles,
    getRecitationProgress,
    getRecitationHistory,
    getRecitationStats
};