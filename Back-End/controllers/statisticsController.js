const pool = require("../config/db");

/**
 * Fonction utilitaire pour formater les résultats en structure attendue
 */
function formatStatisticsResult(rows) {
  if (!rows || rows.length === 0) {
    return { status: "success", data: [] };
  }

  // Grouper par date
  const dateGroups = {};

  rows.forEach((row) => {
    const dateKey = row.period_date;

    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = {
        date: dateKey,
        total_time: 0,
        total_count: 0,
        task_details: [],
      };
    }

    // Ajouter au total général
    dateGroups[dateKey].total_time += parseInt(row.total_time || 0);
    dateGroups[dateKey].total_count += parseInt(row.total_count || 0);

    // Ajouter le détail de la tâche si elle a des données
    if (row.task_name && (row.total_time > 0 || row.total_count > 0)) {
      dateGroups[dateKey].task_details.push({
        name: row.task_name,
        total_time: parseInt(row.total_time || 0),
        total_count: parseInt(row.total_count || 0),
      });
    }
  });

  // Convertir en array et trier par date décroissante
  const data = Object.values(dateGroups).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return { status: "success", data };
}

/**
 * Statistiques journalières
 */
const getDailyStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
            SELECT 
                DATE(s.created_at) as period_date,
                COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée') as task_name,
                SUM(s.total_work_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            GROUP BY DATE(s.created_at), COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée'), t.id
            ORDER BY DATE(s.created_at) DESC, COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée')
            LIMIT 500
        `;

    const result = await pool.query(query, [userId]);
    const formattedResult = formatStatisticsResult(result.rows);

    res.json(formattedResult);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques journalières:",
      error
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération des statistiques journalières",
    });
  }
};

/**
 * Statistiques hebdomadaires (lundi à dimanche)
 */
const getWeeklyStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
            SELECT 
                DATE(DATE_TRUNC('week', s.created_at)) as period_date,
                COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée') as task_name,
                SUM(s.total_work_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            GROUP BY DATE_TRUNC('week', s.created_at), COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée'), t.id
            ORDER BY DATE_TRUNC('week', s.created_at) DESC, COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée')
            LIMIT 500
        `;

    const result = await pool.query(query, [userId]);
    const formattedResult = formatStatisticsResult(result.rows);

    res.json(formattedResult);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques hebdomadaires:",
      error
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération des statistiques hebdomadaires",
    });
  }
};

/**
 * Statistiques mensuelles
 */
const getMonthlyStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
            SELECT 
                DATE(DATE_TRUNC('month', s.created_at)) as period_date,
                COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée') as task_name,
                SUM(s.total_work_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            GROUP BY DATE_TRUNC('month', s.created_at), COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée'), t.id
            ORDER BY DATE_TRUNC('month', s.created_at) DESC, COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée')
            LIMIT 500
        `;

    const result = await pool.query(query, [userId]);
    const formattedResult = formatStatisticsResult(result.rows);

    res.json(formattedResult);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques mensuelles:",
      error
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération des statistiques mensuelles",
    });
  }
};

/**
 * Statistiques annuelles
 */
const getYearlyStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
            SELECT 
                DATE(DATE_TRUNC('year', s.created_at)) as period_date,
                COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée') as task_name,
                SUM(s.total_work_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            GROUP BY DATE_TRUNC('year', s.created_at), COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée'), t.id
            ORDER BY DATE_TRUNC('year', s.created_at) DESC, COALESCE(t.name, s.task_name_snapshot, 'Tâche supprimée')
            LIMIT 500
        `;

    const result = await pool.query(query, [userId]);
    const formattedResult = formatStatisticsResult(result.rows);

    res.json(formattedResult);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des statistiques annuelles:",
      error
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la récupération des statistiques annuelles",
    });
  }
};

/**
 * Supprime tout l'historique de l'utilisateur (sessions complètes)
 */
const deleteAllUserHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(
      `[StatisticsController] Deletion request for user ID: ${userId}`
    );

    // Supprimer toutes les sessions de l'utilisateur
    const deleteSessionsQuery = `
      DELETE FROM sessions 
      WHERE user_id = $1
    `;

    const result = await pool.query(deleteSessionsQuery, [userId]);

    console.log(
      `[StatisticsController] Deleted ${result.rowCount} sessions for user ${userId}`
    );

    res.json({
      status: "success",
      message: "Tout l'historique a été supprimé avec succès",
      deletedSessions: result.rowCount,
    });
  } catch (error) {
    console.error(
      "[StatisticsController] Erreur lors de la suppression de l'historique:",
      error
    );
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la suppression de l'historique",
    });
  }
};

module.exports = {
  getDailyStatistics,
  getWeeklyStatistics,
  getMonthlyStatistics,
  getYearlyStatistics,
  deleteAllUserHistory,
};
