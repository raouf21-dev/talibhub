const statisticsModel = require('../models/statisticsModel');

const formatStats = (stats, dateKey) => {
    return stats.map(stat => {
        const dateValue = stat[dateKey];
        let formattedDate;
        if (dateValue instanceof Date) {
            formattedDate = dateValue.toISOString();
        } else if (typeof dateValue === 'string') {
            formattedDate = new Date(dateValue).toISOString();
        } else {
            console.error(`Date invalide pour la statistique:`, stat);
            formattedDate = new Date().toISOString(); // Utiliser la date actuelle comme fallback
        }
        return {
            date: formattedDate,
            total_time: String(stat.total_time || 0),
            total_count: String(stat.total_count || 0)
        };
    });
};

const handleStats = async (req, res, getStatsFunc, dateKey, periodName) => {
    try {
        const stats = await getStatsFunc(req.user.id);
        console.log(`Statistiques brutes pour ${periodName}:`, stats);
        
        if (!Array.isArray(stats) || stats.length === 0) {
            console.log(`Aucune statistique trouvée pour ${periodName}`);
            return res.json([]);
        }
        
        const formattedStats = formatStats(stats, dateKey);
        console.log(`Statistiques formatées pour ${periodName}:`, formattedStats);
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