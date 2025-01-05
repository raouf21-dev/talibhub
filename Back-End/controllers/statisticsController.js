// statisticsController.js
const statisticsModel = require('../models/statisticsModel');

const formatStats = (stats) => {
    console.log('Stats reçues dans formatStats:', stats);
    
    if (!stats || !Array.isArray(stats) || stats.length === 0) {
        console.log('Pas de stats ou format incorrect, retour valeurs par défaut');
        return [{
            date: new Date().toISOString(),
            total_time: "0",
            total_count: "0"
        }];
    }

    console.log('Stats formatées:', stats);
    return stats; // Retourner le tableau entier
};

const handleStats = async (req, res, getStatsFunc, periodName) => {
    try {
        console.log(`Récupération des stats ${periodName} pour user:`, req.user.id);
        const stats = await getStatsFunc(req.user.id);
        const formattedStats = formatStats(stats);
        
        console.log(`Stats ${periodName} finales:`, formattedStats);
        res.json(formattedStats); // Envoyer le tableau
    } catch (error) {
        console.error(`Erreur lors de la récupération des statistiques ${periodName}:`, error);
        res.status(500).json({
            message: `Erreur lors de la récupération des statistiques ${periodName}`,
            error: error.message
        });
    }
};

exports.getDailyStats = async (req, res) => handleStats(req, res, statisticsModel.getDailyStats, 'journalières');
exports.getWeeklyStats = async (req, res) => handleStats(req, res, statisticsModel.getWeeklyStats, 'hebdomadaires');
exports.getMonthlyStats = async (req, res) => handleStats(req, res, statisticsModel.getMonthlyStats, 'mensuelles');
exports.getYearlyStats = async (req, res) => handleStats(req, res, statisticsModel.getYearlyStats, 'annuelles');