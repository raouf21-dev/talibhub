const statisticsModel = require('../models/statisticsModel');

/**
 * On peut optionnellement normaliser ou pas,
 * Ici, si tu veux juste garder la structure renvoyée,
 * tu peux retourner directement `stats`.
 */
const normalizeStats = (stats) => {
    // Exemple minimal: on vérifie juste si c'est un tableau
    if (!Array.isArray(stats)) return [];
    return stats;
};

const handleStats = async (req, res, getStatsFunc, period) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                status: 'error',
                message: 'User not authenticated'
            });
        }

        const userId = req.user.id;
        console.log(`[Statistics] Fetching "${period}" stats for user:`, userId);

        const rawStats = await getStatsFunc(userId);
        const finalData = normalizeStats(rawStats);

        return res.json({
            status: 'success',
            data: finalData
        });

    } catch (error) {
        console.error(`[Statistics] Error fetching ${period} stats:`, error);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

exports.getDailyStats = (req, res) => handleStats(req, res, statisticsModel.getDailyStats, 'daily');
exports.getWeeklyStats = (req, res) => handleStats(req, res, statisticsModel.getWeeklyStats, 'weekly');
exports.getMonthlyStats = (req, res) => handleStats(req, res, statisticsModel.getMonthlyStats, 'monthly');
exports.getYearlyStats = (req, res) => handleStats(req, res, statisticsModel.getYearlyStats, 'yearly');
