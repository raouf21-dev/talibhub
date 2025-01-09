const pool = require('../config/db');

// Time interval constants
const TIME_INTERVALS = {
    DAILY: "INTERVAL '2 weeks'",
    WEEKLY: "INTERVAL '2 months'",
    MONTHLY: "INTERVAL '1 year'",
    YEARLY: "INTERVAL '2 years'"
};

const getDailyStats = async (userId) => {
    const query = `
        WITH daily_totals AS (
            SELECT 
                DATE(s.created_at) as date,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('day', CURRENT_DATE - ${TIME_INTERVALS.DAILY})
            AND created_at <= CURRENT_DATE
            GROUP BY DATE(s.created_at)
        ),
        task_stats AS (
            SELECT 
                DATE(s.created_at) as date,
                t.id,
                t.name,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as task_total_time,
                SUM(s.counter_value) as task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('day', CURRENT_DATE - ${TIME_INTERVALS.DAILY})
            AND created_at <= CURRENT_DATE
            GROUP BY DATE(s.created_at), t.id, t.name
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
                ) FILTER (WHERE ts.id IS NOT NULL AND ts.date = dt.date),
                '[]'
            ) as task_details
        FROM daily_totals dt
        LEFT JOIN task_stats ts ON dt.date = ts.date
        GROUP BY dt.date, dt.total_time, dt.total_count
        ORDER BY dt.date DESC;
    `;
    
    try {
        console.log('Executing daily stats query for user:', userId);
        const result = await pool.query(query, [userId]);
        console.log('Daily stats results:', result.rows.length, 'rows found');
        return result.rows;
    } catch (error) {
        console.error('Error in getDailyStats:', error);
        throw error;
    }
};

const getWeeklyStats = async (userId) => {
    const query = `
        WITH weekly_totals AS (
            SELECT 
                DATE_TRUNC('week', s.created_at) as date,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('week', CURRENT_DATE - ${TIME_INTERVALS.WEEKLY})
            AND created_at <= CURRENT_DATE
            GROUP BY DATE_TRUNC('week', s.created_at)
        ),
        task_stats AS (
            SELECT 
                DATE_TRUNC('week', s.created_at) as date,
                t.id,
                t.name,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as task_total_time,
                SUM(s.counter_value) as task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('week', CURRENT_DATE - ${TIME_INTERVALS.WEEKLY})
            AND created_at <= CURRENT_DATE
            GROUP BY DATE_TRUNC('week', s.created_at), t.id, t.name
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
                ) FILTER (WHERE ts.id IS NOT NULL AND ts.date = wt.date),
                '[]'
            ) as task_details
        FROM weekly_totals wt
        LEFT JOIN task_stats ts ON wt.date = ts.date
        GROUP BY wt.date, wt.total_time, wt.total_count
        ORDER BY wt.date DESC;
    `;
    
    try {
        console.log('Executing weekly stats query for user:', userId);
        const result = await pool.query(query, [userId]);
        console.log('Weekly stats results:', result.rows.length, 'rows found');
        return result.rows;
    } catch (error) {
        console.error('Error in getWeeklyStats:', error);
        throw error;
    }
};

const getMonthlyStats = async (userId) => {
    const query = `
        WITH monthly_totals AS (
            SELECT 
                DATE_TRUNC('month', s.created_at) as date,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('month', CURRENT_DATE - ${TIME_INTERVALS.MONTHLY})
            AND created_at <= CURRENT_DATE
            GROUP BY DATE_TRUNC('month', s.created_at)
        ),
        task_stats AS (
            SELECT 
                DATE_TRUNC('month', s.created_at) as date,
                t.id,
                t.name,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as task_total_time,
                SUM(s.counter_value) as task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('month', CURRENT_DATE - ${TIME_INTERVALS.MONTHLY})
            AND created_at <= CURRENT_DATE
            GROUP BY DATE_TRUNC('month', s.created_at), t.id, t.name
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
                ) FILTER (WHERE ts.id IS NOT NULL AND ts.date = mt.date),
                '[]'
            ) as task_details
        FROM monthly_totals mt
        LEFT JOIN task_stats ts ON mt.date = ts.date
        GROUP BY mt.date, mt.total_time, mt.total_count
        ORDER BY mt.date DESC;
    `;
    
    try {
        console.log('Executing monthly stats query for user:', userId);
        const result = await pool.query(query, [userId]);
        console.log('Monthly stats results:', result.rows.length, 'rows found');
        return result.rows;
    } catch (error) {
        console.error('Error in getMonthlyStats:', error);
        throw error;
    }
};

const getYearlyStats = async (userId) => {
    const query = `
        WITH yearly_totals AS (
            SELECT 
                DATE_TRUNC('year', s.created_at) as date,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as total_time,
                SUM(s.counter_value) as total_count
            FROM sessions s
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('year', CURRENT_DATE - ${TIME_INTERVALS.YEARLY})
            AND created_at <= CURRENT_DATE
            GROUP BY DATE_TRUNC('year', s.created_at)
        ),
        task_stats AS (
            SELECT 
                DATE_TRUNC('year', s.created_at) as date,
                t.id,
                t.name,
                SUM(s.total_work_time + s.stopwatch_time + s.timer_time) as task_total_time,
                SUM(s.counter_value) as task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
            AND created_at >= DATE_TRUNC('year', CURRENT_DATE - ${TIME_INTERVALS.YEARLY})
            AND created_at <= CURRENT_DATE
            GROUP BY DATE_TRUNC('year', s.created_at), t.id, t.name
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
                ) FILTER (WHERE ts.id IS NOT NULL AND ts.date = yt.date),
                '[]'
            ) as task_details
        FROM yearly_totals yt
        LEFT JOIN task_stats ts ON yt.date = ts.date
        GROUP BY yt.date, yt.total_time, yt.total_count
        ORDER BY yt.date DESC;
    `;
    
    try {
        console.log('Executing yearly stats query for user:', userId);
        const result = await pool.query(query, [userId]);
        console.log('Yearly stats results:', result.rows.length, 'rows found');
        return result.rows;
    } catch (error) {
        console.error('Error in getYearlyStats:', error);
        throw error;
    }
};

module.exports = {
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getYearlyStats
};