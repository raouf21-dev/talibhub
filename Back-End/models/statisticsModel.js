const pool = require('../config/db');

async function getDailyStats(userId) {
    const query = `
        WITH RECURSIVE dates AS (
            -- Génère les 7 derniers jours
            SELECT 
                generate_series(
                    CURRENT_DATE::date,
                    (CURRENT_DATE - INTERVAL '6 days')::date,
                    '-1 day'::interval
                )::date AS date
        ),
        daily_totals AS (
            -- Calcule les totaux par jour
            SELECT
                date(s.created_at)::date AS session_date,
                SUM(COALESCE(s.total_work_time, 0) + 
                    COALESCE(s.timer_time, 0) + 
                    COALESCE(s.stopwatch_time, 0)) AS total_time,
                SUM(COALESCE(s.counter_value, 0)) AS total_count
            FROM sessions s
            WHERE s.user_id = $1
                AND s.created_at >= (CURRENT_DATE - INTERVAL '6 days')
                AND s.created_at < (CURRENT_DATE + INTERVAL '1 day')
            GROUP BY date(s.created_at)::date
        ),
        task_stats AS (
            -- Calcule les statistiques par tâche
            SELECT
                date(s.created_at)::date AS session_date,
                t.id AS task_id,
                t.name,
                SUM(COALESCE(s.total_work_time, 0) + 
                    COALESCE(s.timer_time, 0) + 
                    COALESCE(s.stopwatch_time, 0)) AS task_total_time,
                SUM(COALESCE(s.counter_value, 0)) AS task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
                AND s.created_at >= (CURRENT_DATE - INTERVAL '6 days')
                AND s.created_at < (CURRENT_DATE + INTERVAL '1 day')
            GROUP BY date(s.created_at)::date, t.id, t.name
        )
        SELECT
            dates.date,
            COALESCE(dt.total_time, 0) AS total_time,
            COALESCE(dt.total_count, 0) AS total_count,
            COALESCE(
                (
                    SELECT json_agg(json_build_object(
                        'task_id', ts.task_id,
                        'name', ts.name,
                        'total_time', ts.task_total_time,
                        'total_count', ts.task_total_count
                    ))
                    FROM task_stats ts
                    WHERE ts.session_date = dates.date
                ), 
                '[]'
            ) AS task_details
        FROM dates
        LEFT JOIN daily_totals dt ON dt.session_date = dates.date
        ORDER BY dates.date DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

async function getWeeklyStats(userId) {
    const query = `
        WITH RECURSIVE weeks AS (
            -- Génère les 4 dernières semaines
            SELECT generate_series(
                DATE_TRUNC('week', CURRENT_DATE)::date,
                (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '3 weeks')::date,
                '-1 week'::interval
            )::date AS week_start
        ),
        weekly_totals AS (
            -- Calcule les totaux par semaine
            SELECT
                DATE_TRUNC('week', s.created_at)::date AS session_week,
                SUM(COALESCE(s.total_work_time, 0) + 
                    COALESCE(s.timer_time, 0) + 
                    COALESCE(s.stopwatch_time, 0)) AS total_time,
                SUM(COALESCE(s.counter_value, 0)) AS total_count
            FROM sessions s
            WHERE s.user_id = $1
                AND s.created_at >= (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '3 weeks')
                AND s.created_at < (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week')
            GROUP BY DATE_TRUNC('week', s.created_at)::date
        ),
        task_stats AS (
            -- Calcule les statistiques par tâche
            SELECT
                DATE_TRUNC('week', s.created_at)::date AS session_week,
                t.id AS task_id,
                t.name,
                SUM(COALESCE(s.total_work_time, 0) + 
                    COALESCE(s.timer_time, 0) + 
                    COALESCE(s.stopwatch_time, 0)) AS task_total_time,
                SUM(COALESCE(s.counter_value, 0)) AS task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
                AND s.created_at >= (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '3 weeks')
                AND s.created_at < (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week')
            GROUP BY DATE_TRUNC('week', s.created_at)::date, t.id, t.name
        )
        SELECT
            weeks.week_start AS date,
            COALESCE(wt.total_time, 0) AS total_time,
            COALESCE(wt.total_count, 0) AS total_count,
            COALESCE(
                (
                    SELECT json_agg(json_build_object(
                        'task_id', ts.task_id,
                        'name', ts.name,
                        'total_time', ts.task_total_time,
                        'total_count', ts.task_total_count
                    ))
                    FROM task_stats ts
                    WHERE ts.session_week = weeks.week_start
                ),
                '[]'
            ) AS task_details
        FROM weeks
        LEFT JOIN weekly_totals wt ON wt.session_week = weeks.week_start
        ORDER BY weeks.week_start DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

async function getMonthlyStats(userId) {
    const query = `
        WITH RECURSIVE months AS (
            -- Génère les 12 derniers mois
            SELECT generate_series(
                DATE_TRUNC('month', CURRENT_DATE)::date,
                (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months')::date,
                '-1 month'::interval
            )::date AS month_start
        ),
        monthly_totals AS (
            -- Calcule les totaux par mois
            SELECT
                DATE_TRUNC('month', s.created_at)::date AS session_month,
                SUM(COALESCE(s.total_work_time, 0) + 
                    COALESCE(s.timer_time, 0) + 
                    COALESCE(s.stopwatch_time, 0)) AS total_time,
                SUM(COALESCE(s.counter_value, 0)) AS total_count
            FROM sessions s
            WHERE s.user_id = $1
                AND s.created_at >= (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months')
                AND s.created_at < (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')
            GROUP BY DATE_TRUNC('month', s.created_at)::date
        ),
        task_stats AS (
            -- Calcule les statistiques par tâche
            SELECT
                DATE_TRUNC('month', s.created_at)::date AS session_month,
                t.id AS task_id,
                t.name,
                SUM(COALESCE(s.total_work_time, 0) + 
                    COALESCE(s.timer_time, 0) + 
                    COALESCE(s.stopwatch_time, 0)) AS task_total_time,
                SUM(COALESCE(s.counter_value, 0)) AS task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
                AND s.created_at >= (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months')
                AND s.created_at < (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')
            GROUP BY DATE_TRUNC('month', s.created_at)::date, t.id, t.name
        )
        SELECT
            months.month_start AS date,
            COALESCE(mt.total_time, 0) AS total_time,
            COALESCE(mt.total_count, 0) AS total_count,
            COALESCE(
                (
                    SELECT json_agg(json_build_object(
                        'task_id', ts.task_id,
                        'name', ts.name,
                        'total_time', ts.task_total_time,
                        'total_count', ts.task_total_count
                    ))
                    FROM task_stats ts
                    WHERE ts.session_month = months.month_start
                ),
                '[]'
            ) AS task_details
        FROM months
        LEFT JOIN monthly_totals mt ON mt.session_month = months.month_start
        ORDER BY months.month_start DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

async function getYearlyStats(userId) {
    const query = `
        WITH current_year AS (
            -- Année courante uniquement
            SELECT DATE_TRUNC('year', CURRENT_DATE)::date AS year_start
        ),
        yearly_totals AS (
            -- Calcule les totaux pour l'année
            SELECT
                DATE_TRUNC('year', s.created_at)::date AS session_year,
                SUM(COALESCE(s.total_work_time, 0) + 
                    COALESCE(s.timer_time, 0) + 
                    COALESCE(s.stopwatch_time, 0)) AS total_time,
                SUM(COALESCE(s.counter_value, 0)) AS total_count
            FROM sessions s
            WHERE s.user_id = $1
                AND s.created_at >= DATE_TRUNC('year', CURRENT_DATE)
                AND s.created_at < (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year')
            GROUP BY DATE_TRUNC('year', s.created_at)::date
        ),
        task_stats AS (
            -- Calcule les statistiques par tâche
            SELECT
                DATE_TRUNC('year', s.created_at)::date AS session_year,
                t.id AS task_id,
                t.name,
                SUM(COALESCE(s.total_work_time, 0) + 
                    COALESCE(s.timer_time, 0) + 
                    COALESCE(s.stopwatch_time, 0)) AS task_total_time,
                SUM(COALESCE(s.counter_value, 0)) AS task_total_count
            FROM sessions s
            LEFT JOIN tasks t ON s.task_id = t.id
            WHERE s.user_id = $1
                AND s.created_at >= DATE_TRUNC('year', CURRENT_DATE)
                AND s.created_at < (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year')
            GROUP BY DATE_TRUNC('year', s.created_at)::date, t.id, t.name
        )
        SELECT
            cy.year_start AS date,
            COALESCE(yt.total_time, 0) AS total_time,
            COALESCE(yt.total_count, 0) AS total_count,
            COALESCE(
                (
                    SELECT json_agg(json_build_object(
                        'task_id', ts.task_id,
                        'name', ts.name,
                        'total_time', ts.task_total_time,
                        'total_count', ts.task_total_count
                    ))
                    FROM task_stats ts
                    WHERE ts.session_year = cy.year_start
                ),
                '[]'
            ) AS task_details
        FROM current_year cy
        LEFT JOIN yearly_totals yt ON yt.session_year = cy.year_start
        ORDER BY cy.year_start DESC;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

module.exports = {
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getYearlyStats
};