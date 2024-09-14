const pool = require('../config/db');

const getAllSourates = async () => {
    const { rows } = await pool.query('SELECT * FROM sourates ORDER BY number');
    return rows;
};

const getKnownSourates = async (userId) => {
    const { rows } = await pool.query(`
        SELECT sourate_number, recitation_count
        FROM known_sourates
        WHERE user_id = $1
        ORDER BY sourate_number
    `, [userId]);
    return rows;
};

const saveKnownSourates = async (userId, sourates) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM known_sourates WHERE user_id = $1', [userId]);
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

const incrementRecitationCount = async (userId, sourateNumber) => {
    await pool.query(`
        UPDATE known_sourates 
        SET recitation_count = recitation_count + 1, last_recited = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND sourate_number = $2
    `, [userId, sourateNumber]);
};

const checkCycleCompletion = async (userId) => {
    const { rows } = await pool.query(`
        SELECT MIN(recitation_count) as min_count, MAX(recitation_count) as max_count
        FROM known_sourates
        WHERE user_id = $1
    `, [userId]);

    if (rows[0].min_count === rows[0].max_count && rows[0].min_count > 0) {
        await pool.query(`
            UPDATE user_recitation_stats
            SET complete_cycles = complete_cycles + 1
            WHERE user_id = $1
        `, [userId]);
        return true;
    }
    return false;
};

const recordRecitation = async (userId, firstSourate, secondSourate) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await incrementRecitationCount(userId, firstSourate);
        await incrementRecitationCount(userId, secondSourate);

        const cycleCompleted = await checkCycleCompletion(userId);

        await client.query('COMMIT');
        return cycleCompleted;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getRecitationStats = async (userId) => {
    console.log('Début de getRecitationStats dans le modèle');
    try {
        const { rows } = await pool.query(`
            SELECT 
                COUNT(DISTINCT ks.sourate_number) as total_known,
                COUNT(DISTINCT CASE WHEN ks.recitation_count > 0 THEN ks.sourate_number END) as recited_at_least_once,
                COALESCE(urs.complete_cycles, 0) as complete_cycles
            FROM known_sourates ks
            LEFT JOIN user_recitation_stats urs ON ks.user_id = urs.user_id
            WHERE ks.user_id = $1
            GROUP BY urs.complete_cycles
        `, [userId]);

        console.log('Résultat de la requête:', rows[0]);
        return rows[0] || { total_known: 0, recited_at_least_once: 0, complete_cycles: 0 };
    } catch (error) {
        console.error('Erreur dans getRecitationStats du modèle:', error);
        throw error;
    }
};

const getRecitationHistory = async (userId) => {
    const { rows } = await pool.query(`
        SELECT sourate_number, recitation_count, last_recited
        FROM known_sourates
        WHERE user_id = $1
        ORDER BY last_recited DESC
        LIMIT 50
    `, [userId]);
    return rows;
};

const searchMosques = async (lat, lon) => {
    const query = `
      SELECT id, name, address, latitude, longitude,
        earth_distance(ll_to_earth($1, $2), ll_to_earth(latitude, longitude)) as distance
      FROM mosques
      ORDER BY ll_to_earth($1, $2) <-> ll_to_earth(latitude, longitude)
      LIMIT 10
    `;
    const result = await pool.query(query, [lat, lon]);
    return result.rows;
  };

module.exports = {
    getAllSourates,
    getKnownSourates,
    saveKnownSourates,
    recordRecitation,
    getRecitationStats,
    getRecitationHistory,
    incrementRecitationCount,
    checkCycleCompletion,
    searchMosques
};