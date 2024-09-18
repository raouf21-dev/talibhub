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

const checkCycleCompletion = async (client, userId, cycleId) => {
    // Obtenir toutes les sourates connues de l'utilisateur
    const { rows: knownSouratesRows } = await client.query(`
        SELECT sourate_number FROM known_sourates WHERE user_id = $1
    `, [userId]);
    const knownSourates = knownSouratesRows.map(row => row.sourate_number);

    // Obtenir les sourates récitées dans le cycle actuel
    const { rows: recitedSouratesRows } = await client.query(`
        SELECT DISTINCT sourate_number FROM sourate_recitations
        WHERE user_id = $1 AND cycle_id = $2
    `, [userId, cycleId]);
    const recitedSourates = recitedSouratesRows.map(row => row.sourate_number);

    // Vérifier si toutes les sourates connues ont été récitées
    const allRecited = knownSourates.every(sourate => recitedSourates.includes(sourate));

    if (allRecited) {
        // Marquer le cycle comme complet
        await client.query(`
            UPDATE recitation_cycles SET is_complete = true, end_date = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [cycleId]);
        return true;
    }
    return false;
};



const recordRecitation = async (userId, firstSourate, secondSourate) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Obtenir le cycle en cours ou en créer un nouveau
        let { rows: cycleRows } = await client.query(`
            SELECT id FROM recitation_cycles
            WHERE user_id = $1 AND is_complete = false
            ORDER BY start_date DESC LIMIT 1
        `, [userId]);

        let cycleId;
        if (cycleRows.length > 0) {
            cycleId = cycleRows[0].id;
        } else {
            // Créer un nouveau cycle
            const { rows: newCycleRows } = await client.query(`
                INSERT INTO recitation_cycles (user_id, start_date)
                VALUES ($1, CURRENT_TIMESTAMP)
                RETURNING id
            `, [userId]);
            cycleId = newCycleRows[0].id;
        }

        // Enregistrer les récitations
        const insertRecitationsQuery = `
            INSERT INTO sourate_recitations (user_id, sourate_number, recitation_date, cycle_id)
            VALUES 
            ($1, $2, CURRENT_TIMESTAMP, $4),
            ($1, $3, CURRENT_TIMESTAMP, $4)
        `;
        await client.query(insertRecitationsQuery, [userId, firstSourate, secondSourate, cycleId]);

        // Vérifier si le cycle est complet
        const cycleCompleted = await checkCycleCompletion(client, userId, cycleId);

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
    try {
        // Obtenir le nombre total de sourates connues
        const { rows: totalKnownRows } = await pool.query(`
            SELECT COUNT(*) AS total_known FROM known_sourates WHERE user_id = $1
        `, [userId]);
        const totalKnown = parseInt(totalKnownRows[0].total_known, 10) || 0;

        // Obtenir le cycle en cours ou le plus récent
        const { rows: cycleRows } = await pool.query(`
            SELECT id FROM recitation_cycles
            WHERE user_id = $1
            ORDER BY start_date DESC LIMIT 1
        `, [userId]);

        let recitedAtLeastOnce = 0;
        let completeCycles = 0;

        if (cycleRows.length > 0) {
            const cycleId = cycleRows[0].id;

            // Vérifier si le cycle est complet
            const { rows: cycleStatusRows } = await pool.query(`
                SELECT is_complete FROM recitation_cycles WHERE id = $1
            `, [cycleId]);
            const isComplete = cycleStatusRows[0].is_complete;

            // Obtenir le nombre de sourates récitées dans le cycle
            const { rows: recitedRows } = await pool.query(`
                SELECT COUNT(DISTINCT sourate_number) AS recited_count FROM sourate_recitations
                WHERE user_id = $1 AND cycle_id = $2
            `, [userId, cycleId]);
            recitedAtLeastOnce = parseInt(recitedRows[0].recited_count, 10) || 0;

            // Compter les cycles complets
            const { rows: cyclesRows } = await pool.query(`
                SELECT COUNT(*) AS complete_cycles FROM recitation_cycles
                WHERE user_id = $1 AND is_complete = true
            `, [userId]);
            completeCycles = parseInt(cyclesRows[0].complete_cycles, 10) || 0;
        }

        return {
            total_known: totalKnown,
            recited_at_least_once: recitedAtLeastOnce,
            complete_cycles: completeCycles
        };
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

  const getNotRecitedSourates = async (userId) => {
    // Obtenir le cycle en cours
    const { rows: cycleRows } = await pool.query(`
        SELECT id FROM recitation_cycles
        WHERE user_id = $1 AND is_complete = false
        ORDER BY start_date DESC LIMIT 1
    `, [userId]);

    if (cycleRows.length === 0) {
        // Aucun cycle en cours
        console.log('Aucun cycle en cours pour l\'utilisateur', userId);
        return [];
    }

    const cycleId = cycleRows[0].id;

    // Obtenir les sourates connues
    const { rows: knownSouratesRows } = await pool.query(`
        SELECT sourate_number FROM known_sourates WHERE user_id = $1
    `, [userId]);
    const knownSourates = knownSouratesRows.map(row => row.sourate_number);

    // Obtenir les sourates déjà récitées dans le cycle actuel
    const { rows: recitedSouratesRows } = await pool.query(`
        SELECT DISTINCT sourate_number FROM sourate_recitations
        WHERE user_id = $1 AND cycle_id = $2
    `, [userId, cycleId]);
    const recitedSourates = recitedSouratesRows.map(row => row.sourate_number);

    // Filtrer les sourates non récitées
    const notRecitedSouratesNumbers = knownSourates.filter(sourate => !recitedSourates.includes(sourate));

    // Si le tableau est vide, ajouter un log
    if (notRecitedSouratesNumbers.length === 0) {
        console.log('Toutes les sourates connues ont été récitées dans ce cycle.');
    }

    // Obtenir les informations des sourates
    const { rows: notRecitedSourates } = await pool.query(`
        SELECT * FROM sourates WHERE number = ANY($1::int[])
    `, [notRecitedSouratesNumbers]);

    return notRecitedSourates;
};


const startNewCycle = async (userId) => {
    await pool.query(`
        INSERT INTO recitation_cycles (user_id, start_date)
        VALUES ($1, CURRENT_TIMESTAMP)
    `, [userId]);
};

const getSouratesByNumbers = async (sourateNumbers) => {
    const { rows } = await pool.query(`
        SELECT * FROM sourates WHERE number = ANY($1::int[])
    `, [sourateNumbers]);
    return rows;
};

const getMemorizationStatus = async (userId) => {
    const { rows } = await pool.query(`
        SELECT surah_number AS sourate_number, memorization_level, last_revision_date
        FROM surah_memorization
        WHERE user_id = $1
    `, [userId]);
    return rows;
};

const updateMemorizationStatus = async (userId, sourateNumber, memorizationLevel, lastRevisionDate) => {
    const nextRevisionDate = calculateNextRevisionDate(lastRevisionDate, memorizationLevel);
    await pool.query(`
        INSERT INTO surah_memorization (user_id, surah_number, memorization_level, last_revision_date, next_revision_date)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, surah_number) DO UPDATE
        SET memorization_level = EXCLUDED.memorization_level,
            last_revision_date = EXCLUDED.last_revision_date,
            next_revision_date = EXCLUDED.next_revision_date;
    `, [userId, sourateNumber, memorizationLevel, lastRevisionDate, nextRevisionDate]);
};

const getMemorizationHistory = async (userId) => {
    const { rows } = await pool.query(`
        SELECT s.name, s.number, sm.last_revision_date, sm.memorization_level, sm.next_revision_date
        FROM surah_memorization sm
        JOIN sourates s ON s.number = sm.surah_number
        WHERE sm.user_id = $1
        ORDER BY sm.last_revision_date DESC;
    `, [userId]);
    return rows;
};

const clearMemorizationHistory = async (userId) => {
    await pool.query(`
        DELETE FROM surah_memorization WHERE user_id = $1;
    `, [userId]);
};

// Fonction pour calculer la prochaine date de révision
function calculateNextRevisionDate(lastRevisionDate, memorizationLevel) {
    const date = new Date(lastRevisionDate);
    switch (memorizationLevel) {
        case 'Strong':
            date.setDate(date.getDate() + 30);
            break;
        case 'Good':
            date.setDate(date.getDate() + 14);
            break;
        case 'Moderate':
            date.setDate(date.getDate() + 7);
            break;
        case 'Weak':
            date.setDate(date.getDate() + 3);
            break;
        default:
            date.setDate(date.getDate() + 7);
    }
    return date.toISOString().split('T')[0];
}

// N'oubliez pas d'exporter les nouvelles fonctions
module.exports = {
    getAllSourates,
    getKnownSourates,
    saveKnownSourates,
    recordRecitation,
    getRecitationStats,
    getRecitationHistory,
    incrementRecitationCount,
    checkCycleCompletion,
    searchMosques,
    getNotRecitedSourates,
    startNewCycle,
    getSouratesByNumbers,
    getMemorizationStatus,
    updateMemorizationStatus,
    getMemorizationHistory,
    clearMemorizationHistory,
};
