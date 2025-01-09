const statisticsModel = require('../models/statisticsModel');

/**
 * Normalizes statistics data and handles empty/invalid cases
 * @param {Array} stats - Raw statistics from the model
 * @returns {Array} Normalized statistics
 */
const normalizeStats = (stats) => {
    const defaultStat = {
        date: new Date().toISOString(),
        total_time: 0,
        total_count: 0,
        task_details: []
    };

    try {
        if (!stats || !Array.isArray(stats) || stats.length === 0) {
            return [defaultStat];
        }

        return stats.map(stat => ({
            ...stat,
            total_time: Number(stat.total_time) || 0,
            total_count: Number(stat.total_count) || 0,
            task_details: Array.isArray(stat.task_details) ? stat.task_details : []
        }));
    } catch (error) {
        console.error('Error in normalizeStats:', error);
        return [defaultStat];
    }
};

/**
 * Generic handler for statistics requests
 */
const handleStats = async (req, res, getStatsFunc, period) => {
    try {
        // Validate user
        if (!req.user?.id) {
            return res.status(401).json({
                status: 'error',
                message: 'User not authenticated'
            });
        }

        const userId = req.user.id;
        console.log(`[Statistics] Fetching ${period} stats for user:`, userId);

        // Get and normalize stats
        const rawStats = await getStatsFunc(userId);
        const normalizedStats = normalizeStats(rawStats);

        // Log only in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Statistics] ${period} stats processed:`, 
                JSON.stringify(normalizedStats, null, 2)
            );
        }

        return res.json({
            status: 'success',
            data: normalizedStats
        });

    } catch (error) {
        console.error(`[Statistics] Error fetching ${period} stats:`, error);
        
        const statusCode = error.name === 'ValidationError' ? 400 : 500;
        const errorMessage = process.env.NODE_ENV === 'production' 
            ? 'An error occurred while fetching statistics'
            : error.message;

        return res.status(statusCode).json({
            status: 'error',
            message: errorMessage
        });
    }
};

// Export consistent English-named endpoints
exports.getDailyStats = async (req, res) => handleStats(req, res, statisticsModel.getDailyStats, 'daily');
exports.getWeeklyStats = async (req, res) => handleStats(req, res, statisticsModel.getWeeklyStats, 'weekly');
exports.getMonthlyStats = async (req, res) => handleStats(req, res, statisticsModel.getMonthlyStats, 'monthly');
exports.getYearlyStats = async (req, res) => handleStats(req, res, statisticsModel.getYearlyStats, 'yearly');