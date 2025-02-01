// controllers/timerController.js
const pool = require('../config/db');

const defaultState = {
    isRunning: false,
    isWorkSession: true,
    workDuration: 25 * 60, // 25 minutes en secondes
    breakDuration: 5 * 60,  // 5 minutes en secondes
    currentTime: 25 * 60
};

const loadTimerState = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT 
                is_running, 
                is_work_session, 
                work_duration, 
                break_duration, 
                current_timer
            FROM timer_state 
            WHERE user_id = $1
        `;
        
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length > 0) {
            const state = {
                isRunning: result.rows[0].is_running,
                isWorkSession: result.rows[0].is_work_session,
                workDuration: result.rows[0].work_duration,
                breakDuration: result.rows[0].break_duration,
                currentTime: result.rows[0].current_timer
            };
            res.json(state);
        } else {
            // Retourner les valeurs par défaut si aucun état n'existe
            try {
                const insertQuery = `
                    INSERT INTO timer_state 
                    (user_id, is_running, is_work_session, work_duration, break_duration, current_timer)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `;
                
                await pool.query(insertQuery, [
                    userId,
                    defaultState.isRunning,
                    defaultState.isWorkSession,
                    defaultState.workDuration,
                    defaultState.breakDuration,
                    defaultState.currentTime
                ]);
                
                res.json(defaultState);
            } catch (insertError) {
                console.error('Erreur lors de la création de l\'état par défaut:', insertError);
                res.json(defaultState);
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement du timer:', error);
        res.status(500).json({ 
            error: 'Erreur lors du chargement des paramètres du timer' 
        });
    }
};

const saveTimerState = async (req, res) => {
    try {
        const userId = req.user.id;
        const { isRunning, isWorkSession, workDuration, breakDuration, currentTime } = req.body;

        const query = `
            INSERT INTO timer_state 
            (user_id, is_running, is_work_session, work_duration, break_duration, current_timer)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                is_running = EXCLUDED.is_running,
                is_work_session = EXCLUDED.is_work_session,
                work_duration = EXCLUDED.work_duration,
                break_duration = EXCLUDED.break_duration,
                current_timer = EXCLUDED.current_timer
        `;

        await pool.query(query, [
            userId,
            isRunning,
            isWorkSession,
            workDuration,
            breakDuration,
            currentTime
        ]);

        res.json({ message: 'Timer state saved successfully' });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du timer:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la sauvegarde des paramètres du timer' 
        });
    }
};

const addCompletedTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const { taskName, value, type } = req.body;
        
        const query = `
            INSERT INTO completed_tasks (user_id, task_name, value, type, date)
            VALUES ($1, $2, $3, $4, CURRENT_DATE)
        `;
        
        await pool.query(query, [userId, taskName, value, type]);
        res.json({ message: 'Task added successfully' });
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la tâche:', error);
        res.status(500).json({ 
            error: 'Erreur lors de l\'ajout de la tâche complétée' 
        });
    }
};

module.exports = {
    loadTimerState,
    saveTimerState,
    addCompletedTask
};