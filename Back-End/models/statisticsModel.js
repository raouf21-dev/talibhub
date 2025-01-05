// statisticsModel.js
const pool = require('../config/db');

const getDailyStats = async (userId) => {
    const query = `
        WITH daily_totals AS (
            SELECT 
                DATE(s.created_at) as date,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            WHERE s.user_id = $1
            AND DATE(s.created_at) = CURRENT_DATE
            GROUP BY DATE(s.created_at)
        ),
        task_stats AS (
            SELECT 
                t.id,
                t.name,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as task_total_time,
                SUM(s.counter_value) as task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            AND DATE(s.created_at) = CURRENT_DATE
            GROUP BY t.id, t.name
        )
        SELECT 
            dt.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'task_id', ts.id,
                        'name', ts.name,
                        'total_time', ts.task_total_time,
                        'total_count', ts.task_total_count
                    )
                ) FILTER (WHERE ts.id IS NOT NULL),
                '[]'
            ) as task_details
        FROM daily_totals dt
        LEFT JOIN task_stats ts ON true
        GROUP BY dt.date, dt.total_time, dt.total_count;
    `;
    
    try {
        console.log('Exécution de la requête daily stats pour user:', userId);
        const result = await pool.query(query, [userId]);
        console.log('Résultat daily stats:', result.rows);
        return result.rows;
    } catch (error) {
        console.error('Erreur dans getDailyStats:', error);
        throw error;
    }
};

const getWeeklyStats = async (userId) => {
    const query = `
        WITH weekly_totals AS (
            SELECT 
                CURRENT_DATE as date,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('week', CURRENT_DATE)
            AND created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
            GROUP BY DATE_TRUNC('week', CURRENT_DATE)
        ),
        task_stats AS (
            SELECT 
                t.id,
                t.name,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as task_total_time,
                SUM(s.counter_value) as task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('week', CURRENT_DATE)
            AND created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
            GROUP BY t.id, t.name
        )
        SELECT 
            wt.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'task_id', ts.id,
                        'name', ts.name,
                        'total_time', ts.task_total_time,
                        'total_count', ts.task_total_count
                    )
                ) FILTER (WHERE ts.id IS NOT NULL),
                '[]'
            ) as task_details
        FROM weekly_totals wt
        LEFT JOIN task_stats ts ON true
        GROUP BY wt.date, wt.total_time, wt.total_count;
    `;
    
    try {
        console.log('Exécution de la requête weekly stats pour user:', userId);
        const result = await pool.query(query, [userId]);
        console.log('Résultat weekly stats:', result.rows);
        return result.rows;
    } catch (error) {
        console.error('Erreur dans getWeeklyStats:', error);
        throw error;
    }
};

const getMonthlyStats = async (userId) => {
    const query = `
        WITH monthly_totals AS (
            SELECT 
                CURRENT_DATE as date,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
            AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            GROUP BY DATE_TRUNC('month', CURRENT_DATE)
        ),
        task_stats AS (
            SELECT 
                t.id,
                t.name,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as task_total_time,
                SUM(s.counter_value) as task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
            AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            GROUP BY t.id, t.name
        )
        SELECT 
            mt.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'task_id', ts.id,
                        'name', ts.name,
                        'total_time', ts.task_total_time,
                        'total_count', ts.task_total_count
                    )
                ) FILTER (WHERE ts.id IS NOT NULL),
                '[]'
            ) as task_details
        FROM monthly_totals mt
        LEFT JOIN task_stats ts ON true
        GROUP BY mt.date, mt.total_time, mt.total_count;
    `;
    
    try {
        console.log('Exécution de la requête monthly stats pour user:', userId);
        const result = await pool.query(query, [userId]);
        console.log('Résultat monthly stats:', result.rows);
        return result.rows;
    } catch (error) {
        console.error('Erreur dans getMonthlyStats:', error);
        throw error;
    }
};

const getYearlyStats = async (userId) => {
    const query = `
        WITH yearly_totals AS (
            SELECT 
                CURRENT_DATE as date,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
            AND created_at < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
            GROUP BY DATE_TRUNC('year', CURRENT_DATE)
        ),
        task_stats AS (
            SELECT 
                t.id,
                t.name,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as task_total_time,
                SUM(s.counter_value) as task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('year', CURRENT_DATE)
            AND created_at < DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year'
            GROUP BY t.id, t.name
        )
        SELECT 
            yt.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'task_id', ts.id,
                        'name', ts.name,
                        'total_time', ts.task_total_time,
                        'total_count', ts.task_total_count
                    )
                ) FILTER (WHERE ts.id IS NOT NULL),
                '[]'
            ) as task_details
        FROM yearly_totals yt
        LEFT JOIN task_stats ts ON true
        GROUP BY yt.date, yt.total_time, yt.total_count;
    `;
    
    try {
        console.log('Exécution de la requête yearly stats pour user:', userId);
        const result = await pool.query(query, [userId]);
        console.log('Résultat yearly stats:', result.rows);
        return result.rows;
    } catch (error) {
        console.error('Erreur dans getYearlyStats:', error);
        throw error;
    }
};

module.exports = {
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getYearlyStats
};