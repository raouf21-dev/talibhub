// surahMemorizationModel.js
const pool = require('../config/db'); // Assurez-vous que c'est votre configuration de base de données

// Fonction pour calculer la prochaine date de révision
const calculateNextRevisionDate = (lastRevisionDate, memorizationLevel) => {
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
      date.setDate(date.getDate() + 7); // Par défaut, une semaine
  }
  return date.toISOString().split('T')[0];
};

// Récupérer les sourates de l'utilisateur
const getSurahsByUser = async (userId) => {
  const query = `
    SELECT s.number, s.name, s.arabic,
      sm.memorization_level AS "memorizationLevel",
      sm.last_revision_date AS "lastRevisionDate",
      sm.next_revision_date AS "nextRevisionDate",
      COALESCE(sm.is_known, FALSE) AS "isKnown"
    FROM sourates s
    LEFT JOIN surah_memorization sm ON sm.surah_number = s.number AND sm.user_id = $1
    ORDER BY s.number DESC; -- Ordre décroissant
  `;
  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Erreur dans getSurahsByUser:', error);
    throw error;
  }
};

// Mettre à jour le statut de mémorisation d'une sourate
const updateSurahStatus = async (userId, surahNumber, memorizationLevel, lastRevisionDate) => {
  const nextRevisionDate = calculateNextRevisionDate(lastRevisionDate, memorizationLevel);
  const query = `
    INSERT INTO surah_memorization (user_id, surah_number, memorization_level, last_revision_date, next_revision_date)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id, surah_number) DO UPDATE
    SET memorization_level = EXCLUDED.memorization_level,
        last_revision_date = EXCLUDED.last_revision_date,
        next_revision_date = EXCLUDED.next_revision_date;
  `;
  try {
    console.log(`Mise à jour du statut de mémorisation pour l'utilisateur ${userId}, sourate ${surahNumber}`);
    const result = await pool.query(query, [userId, surahNumber, memorizationLevel, lastRevisionDate, nextRevisionDate]);
    console.log('Statut de mémorisation mis à jour avec succès');
    return result;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de mémorisation:', error);
    throw error;
  }
};

// Récupérer l'historique de révision
const getRevisionHistory = async (userId) => {
  const query = `
    SELECT s.name, s.number, sm.last_revision_date AS "lastRevisionDate", sm.memorization_level AS "memorizationLevel", sm.next_revision_date AS "nextRevisionDate"
    FROM surah_memorization sm
    JOIN sourates s ON s.number = sm.surah_number
    WHERE sm.user_id = $1
    ORDER BY sm.last_revision_date DESC;
  `;
  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Erreur dans getRevisionHistory:', error);
    throw error;
  }
};

// Effacer l'historique de révision
const clearRevisionHistory = async (userId) => {
  const query = `DELETE FROM surah_memorization WHERE user_id = $1;`;
  try {
    await pool.query(query, [userId]);
    console.log('Historique de révision effacé avec succès pour l\'utilisateur', userId);
  } catch (error) {
    console.error('Erreur dans clearRevisionHistory:', error);
    throw error;
  }
};

// Enregistrer les sourates connues
const saveKnownSurahs = async (userId, surahNumbers) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Marquer toutes les sourates comme non connues
    await client.query(`
      UPDATE surah_memorization
      SET is_known = FALSE
      WHERE user_id = $1
    `, [userId]);

    // Mettre à jour les sourates sélectionnées comme connues (is_known = TRUE), ou les insérer si elles n'existent pas
    const upsertQuery = `
      INSERT INTO surah_memorization (user_id, surah_number, is_known)
      VALUES ($1, $2, TRUE)
      ON CONFLICT (user_id, surah_number) DO UPDATE
      SET is_known = EXCLUDED.is_known;
    `;
    for (const surahNumber of surahNumbers) {
      await client.query(upsertQuery, [userId, surahNumber]);
    }

    await client.query('COMMIT');
    console.log('Sourates connues mises à jour avec succès pour l\'utilisateur', userId);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la mise à jour des sourates connues:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Récupérer les sourates connues
const getKnownSurahs = async (userId) => {
  const query = `
    SELECT surah_number
    FROM surah_memorization
    WHERE user_id = $1 AND is_known = TRUE
  `;
  try {
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => row.surah_number);
  } catch (error) {
    console.error('Erreur dans getKnownSurahs:', error);
    throw error;
  }
};

// Export des fonctions
module.exports = {
  getSurahsByUser,
  updateSurahStatus,
  getRevisionHistory,
  clearRevisionHistory,
  saveKnownSurahs,
  getKnownSurahs,
};
