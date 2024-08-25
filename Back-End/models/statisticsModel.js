const pool = require('../config/db');

const getDailyStats = async (userId) => {
    const query = `
        SELECT 
            DATE(created_at) as date,
            SUM(total_work_time + stopwatch_time + timer_time) as total_time,
            SUM(counter_value) as total_count
        FROM sessions
        WHERE user_id = $1
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

const getWeeklyStats = async (userId) => {
    const query = `
        SELECT 
            DATE_TRUNC('week', created_at) as date,
            SUM(total_work_time + stopwatch_time + timer_time) as total_time,
            SUM(counter_value) as total_count
        FROM sessions
        WHERE user_id = $1
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY DATE_TRUNC('week', created_at)
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

const getMonthlyStats = async (userId) => {
    const query = `
        SELECT 
            DATE_TRUNC('month', created_at) as date,
            SUM(total_work_time + stopwatch_time + timer_time) as total_time,
            SUM(counter_value) as total_count
        FROM sessions
        WHERE user_id = $1
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

const getYearlyStats = async (userId) => {
    const query = `
        SELECT 
            DATE_TRUNC('year', created_at) as date,
            SUM(total_work_time + stopwatch_time + timer_time) as total_time,
            SUM(counter_value) as total_count
        FROM sessions
        WHERE user_id = $1
        GROUP BY DATE_TRUNC('year', created_at)
        ORDER BY DATE_TRUNC('year', created_at)
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

module.exports = {
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getYearlyStats
};