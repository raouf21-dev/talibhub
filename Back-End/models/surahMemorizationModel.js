// surahMemorizationModel.js
const pool = require('../config/db'); // Assurez-vous que c'est votre configuration de base de données

const surahMemorizationModel = {
  getSurahsByUser: async (userId) => {
    const query = `
      SELECT s.number, s.name, s.arabic, sm.memorization_level AS "memorizationLevel", sm.last_revision_date AS "lastRevisionDate", sm.next_revision_date AS "nextRevisionDate"
      FROM sourates s
      LEFT JOIN surah_memorization sm ON sm.surah_number = s.number AND sm.user_id = $1
      ORDER BY s.number;
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Erreur dans getSurahsByUser:', error);
      throw error;
    }
  },

  updateSurahStatus: async (userId, surahNumber, memorizationLevel, lastRevisionDate) => {
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
  },
  

  getRevisionHistory: async (userId) => {
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
  },

  clearRevisionHistory: async (userId) => {
    const query = `DELETE FROM surah_memorization WHERE user_id = $1;`;
    try {
      await pool.query(query, [userId]);
      console.log('Historique de révision effacé avec succès pour l\'utilisateur', userId);
    } catch (error) {
      console.error('Erreur dans clearRevisionHistory:', error);
      throw error;
    }
  },

  saveKnownSurahs: async (userId, sourateNumbers) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Supprimer les sourates connues existantes pour l'utilisateur
      await client.query('DELETE FROM surah_memorization WHERE user_id = $1', [userId]);
      // Insérer les nouvelles sourates connues
      const insertQuery = `
        INSERT INTO surah_memorization (user_id, surah_number)
        VALUES ($1, $2)
      `;
      for (const sourateNumber of sourateNumbers) {
        await client.query(insertQuery, [userId, sourateNumber]);
      }
      await client.query('COMMIT');
      console.log('Sourates connues enregistrées avec succès pour l\'utilisateur', userId);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erreur lors de l\'enregistrement des sourates connues:', error);
      throw error;
    } finally {
      client.release();
    }
  }
};

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
      date.setDate(date.getDate() + 7); // Par défaut, une semaine
  }
  return date.toISOString().split('T')[0];
}

module.exports = surahMemorizationModel;
