const statisticsModel = require('../models/statisticsModel');

const formatStats = (stats, dateKey) => {
    return stats.map(stat => ({
        date: stat[dateKey].toISOString(),
        total_time: String(stat.total_time),
        total_count: String(stat.total_count)
    }));
};

const handleStats = async (req, res, getStatsFunc, dateKey, periodName) => {
    try {
        const stats = await getStatsFunc(req.user.id);
        const formattedStats = formatStats(stats, dateKey);
        res.json(formattedStats);
    } catch (error) {
        console.error(`Erreur lors de la récupération des statistiques ${periodName}:`, error);
        res.status(500).json({ message: `Erreur lors de la récupération des statistiques ${periodName}`, error: error.message });
    }
};

exports.getDailyStats = async (req, res) => handleStats(req, res, statisticsModel.getDailyStats, 'date', 'journalières');
exports.getWeeklyStats = async (req, res) => handleStats(req, res, statisticsModel.getWeeklyStats, 'week', 'hebdomadaires');
exports.getMonthlyStats = async (req, res) => handleStats(req, res, statisticsModel.getMonthlyStats, 'month', 'mensuelles');
exports.getYearlyStats = async (req, res) => handleStats(req, res, statisticsModel.getYearlyStats, 'year', 'annuelles');