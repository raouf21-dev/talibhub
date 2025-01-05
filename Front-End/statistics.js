// statistics.js
import { ChartManager } from './charts.js';

class StatisticsManager {
    constructor() {
        this.currentPeriods = {
            daily: new Date(),
            weekly: new Date(),
            monthly: new Date(),
            yearly: new Date()
        };
        this.latestRecords = {
            daily: null,
            weekly: null,
            monthly: null,
            yearly: null
        };
        this.earliestRecords = {
            daily: null,
            weekly: null,
            monthly: null,
            yearly: null
        };
        this.currentData = {
            daily: [],
            weekly: [],
            monthly: [],
            yearly: []
        };
        this.initialized = false;
    }


    async fetchStatisticsData(period) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Pas de token trouvé');
                return null;
            }
    
            const response = await fetch(`/api/statistics/${period}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (!response.ok) {
                throw new Error(`Erreur HTTP! status: ${response.status}`);
            }
    
            const data = await response.json();
            console.log(`Données brutes reçues pour ${period}:`, {
                nombreDonnées: Array.isArray(data) ? data.length : 0,
                données: data
            });
            
            if (!Array.isArray(data)) {
                console.error(`Les données reçues pour ${period} ne sont pas un tableau`);
                return [];
            }
            
            if (data.length > 0) {
                this.currentData[period] = data;
                
                // Trier les données par date
                const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
                
                // Stocker les dates limites
                this.latestRecords[period] = new Date(sortedData[0].date);
                this.earliestRecords[period] = new Date(sortedData[sortedData.length - 1].date);
                
                console.log(`Limites temporelles pour ${period}:`, {
                    dernièreDate: this.latestRecords[period],
                    premièreDate: this.earliestRecords[period],
                    nombreTotal: sortedData.length
                });
            }
            
            return data;
        } catch (error) {
            console.error(`Erreur lors de la récupération des statistiques ${period}:`, error);
            return [];
        }
    }


getDataForCurrentPeriod(period) {
    const currentDate = this.currentPeriods[period];
    const data = this.currentData[period];

    if (!data || !data.length) return null;

    console.log(`Traitement ${period}:`, {
        dateCourante: currentDate,
        donnéesBrutes: data
    });

    const isInCurrentPeriod = (dateStr) => {
        const date = new Date(dateStr);
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        switch(period) {
            case 'daily': {
                const dayStart = new Date(currentDate);
                dayStart.setHours(0, 0, 0, 0);
                return compareDate.getTime() === dayStart.getTime();
            }
            case 'weekly': {
                const weekStart = new Date(currentDate);
                const day = currentDate.getDay() || 7;
                weekStart.setDate(currentDate.getDate() - day + 1);
                weekStart.setHours(0, 0, 0, 0);

                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);

                return compareDate >= weekStart && compareDate <= weekEnd;
            }
            case 'monthly': {
                return compareDate.getMonth() === currentDate.getMonth() &&
                       compareDate.getFullYear() === currentDate.getFullYear();
            }
            case 'yearly': {
                return compareDate.getFullYear() === currentDate.getFullYear();
            }
            default:
                return false;
        }
    };

    const filteredData = data.filter(item => isInCurrentPeriod(item.date));

    if (filteredData.length === 0) {
        console.log(`Aucune donnée pour ${period} à la date ${currentDate}`);
        return null;
    }

    // Maintenant gérer les données de la même manière pour toutes les périodes
    const totalTime = filteredData.reduce((sum, item) => {
        const time = parseFloat(item.total_time || 0);
        console.log(`Ajout temps: ${time} au total: ${sum}`);
        return sum + time;
    }, 0);

    const totalCount = filteredData.reduce((sum, item) => {
        const count = parseInt(item.total_count || 0);
        console.log(`Ajout comptage: ${count} au total: ${sum}`);
        return sum + count;
    }, 0);

    // Fusionner les task_details de toutes les entrées filtrées
    const allTaskDetails = filteredData.reduce((all, item) => {
        if (item.task_details && Array.isArray(item.task_details)) {
            return [...all, ...item.task_details];
        }
        return all;
    }, []);

    // Regrouper les tâches et sommer leurs valeurs
    const taskDetailsMap = new Map();
    allTaskDetails.forEach(task => {
        if (!taskDetailsMap.has(task.task_id)) {
            taskDetailsMap.set(task.task_id, {
                task_id: task.task_id,
                name: task.name,
                total_time: 0,
                total_count: 0
            });
        }
        const existingTask = taskDetailsMap.get(task.task_id);
        existingTask.total_time += parseFloat(task.total_time || 0);
        existingTask.total_count += parseInt(task.total_count || 0);
    });

    return {
        date: currentDate,
        total_time: totalTime.toString(),
        total_count: totalCount.toString(),
        task_details: Array.from(taskDetailsMap.values())
    };
}

    async updatePeriodData(period) {
        try {
            if (!this.currentData[period].length) {
                await this.fetchStatisticsData(period);
            }
    
            const currentPeriodData = this.getDataForCurrentPeriod(period);
            
            if (currentPeriodData) {
                const labels = [this.formatPeriodLabel(this.currentPeriods[period], period)];
                const timeData = [Math.round(parseFloat(currentPeriodData.total_time) / 60)];
                const countData = [parseInt(currentPeriodData.total_count)];
    
                console.log(`Mise à jour du graphique ${period}:`, {
                    period,
                    labels,
                    timeData,
                    countData,
                    taskDetails: currentPeriodData.task_details || []
                });
    
                ChartManager.updateChart(
                    period, 
                    labels, 
                    timeData, 
                    countData,
                    currentPeriodData.task_details || []
                );
            } else {
                ChartManager.updateChart(period, ['Pas de données'], [0], [0], []);
            }
    
            this.updatePeriodDisplay(period);
            this.updateNavigationButtons(period);
        } catch (error) {
            console.error(`Erreur lors de la mise à jour des données ${period}:`, error);
        }
    }

    isNavigationAllowed(period, direction) {
        const currentDate = this.currentPeriods[period];
        const latestRecord = this.latestRecords[period];
        const earliestRecord = this.earliestRecords[period];
        
        if (!latestRecord || !earliestRecord) return false;

        // Pour la navigation vers l'avant (next)
        if (direction > 0) {
            switch(period) {
                case 'daily':
                    return currentDate < latestRecord;
                case 'weekly': {
                    const currentWeekEnd = new Date(currentDate);
                    currentWeekEnd.setDate(currentDate.getDate() + 7);
                    return currentWeekEnd <= latestRecord;
                }
                case 'monthly': {
                    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
                    return currentMonthEnd <= latestRecord;
                }
                case 'yearly': {
                    const currentYearEnd = new Date(currentDate.getFullYear() + 1, 0, 1);
                    return currentYearEnd <= latestRecord;
                }
            }
        }
        
        // Pour la navigation vers l'arrière (prev)
        switch(period) {
            case 'daily':
                return currentDate > earliestRecord;
            case 'weekly': {
                const currentWeekStart = new Date(currentDate);
                currentWeekStart.setDate(currentDate.getDate() - 7);
                return currentWeekStart >= earliestRecord;
            }
            case 'monthly': {
                const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                return currentMonthStart >= earliestRecord;
            }
            case 'yearly': {
                const currentYearStart = new Date(currentDate.getFullYear() - 1, 0, 1);
                return currentYearStart >= earliestRecord;
            }
        }
    }

    setupNavigationListeners() {
        document.querySelectorAll('.period-navigation').forEach(nav => {
            const period = nav.dataset.period;
            const prevBtn = nav.querySelector('.prev');
            const nextBtn = nav.querySelector('.next');

            prevBtn.addEventListener('click', () => this.navigatePeriod(period, -1));
            nextBtn.addEventListener('click', () => this.navigatePeriod(period, 1));
        });
    }

    updateNavigationButtons(period) {
        const nav = document.querySelector(`[data-period="${period}"]`);
        if (!nav) return;

        const nextBtn = nav.querySelector('.next');
        const prevBtn = nav.querySelector('.prev');

        nextBtn.disabled = !this.isNavigationAllowed(period, 1);
        prevBtn.disabled = !this.isNavigationAllowed(period, -1);

        nextBtn.classList.toggle('disabled', nextBtn.disabled);
        prevBtn.classList.toggle('disabled', prevBtn.disabled);
    }

    navigatePeriod(period, direction) {
        if (!this.isNavigationAllowed(period, direction)) {
            console.log(`Navigation bloquée pour ${period} direction ${direction}`);
            return;
        }

        const date = this.currentPeriods[period];
        
        switch(period) {
            case 'daily':
                date.setDate(date.getDate() + direction);
                break;
            case 'weekly':
                date.setDate(date.getDate() + direction * 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + direction);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + direction);
                break;
        }

        this.updatePeriodDisplay(period);
        this.updatePeriodData(period);
    }

    processStatisticsData(data, period) {
        if (!data || !data.length) return { labels: [], timeData: [], countData: [] };

        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastRecord = sortedData[0];
        
        return {
            labels: [this.formatPeriodLabel(lastRecord.date, period)],
            timeData: [Math.round(parseFloat(lastRecord.total_time) / 60)],
            countData: [parseInt(lastRecord.total_count)]
        };
    }

    formatPeriodLabel(dateStr, period) {
        const date = new Date(dateStr);
        
        switch(period) {
            case 'daily':
                return date.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            case 'weekly': {
                const monday = new Date(date);
                const dayOfWeek = monday.getDay() || 7;
                monday.setDate(monday.getDate() - dayOfWeek + 1);
                return `Semaine du ${monday.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })}`;
            }
            case 'monthly':
                return date.toLocaleDateString('fr-FR', {
                    month: 'long',
                    year: 'numeric'
                });
            case 'yearly':
                return date.toLocaleDateString('fr-FR', {
                    year: 'numeric'
                });
            default:
                return date.toLocaleDateString('fr-FR');
        }
    }

    updatePeriodDisplay(period) {
        const display = document.getElementById(`${period}-period`);
        if (!display) return;
        display.textContent = this.formatPeriodLabel(this.currentPeriods[period], period);
    }

    setupAutoRefresh() {
        setInterval(() => {
            ['daily', 'weekly', 'monthly', 'yearly'].forEach(period => 
                this.updatePeriodData(period)
            );
        }, 300000);
    }

    cleanup() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        ChartManager.destroy();
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            console.log('Initialisation des statistiques...');
            
            // Initialiser les graphiques
            ChartManager.init();
            
            // Charger les données initiales
            await Promise.all([
                'daily', 
                'weekly', 
                'monthly', 
                'yearly'
            ].map(period => this.updatePeriodData(period)));

            // Configurer les écouteurs d'événements
            this.setupNavigationListeners();
            this.refreshInterval = this.setupAutoRefresh();

            this.initialized = true;
            console.log('Initialisation des statistiques terminée');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation des statistiques:', error);
            throw error;
        }
    }
}

const statisticsManager = new StatisticsManager();

export const initializeStatistics = () => statisticsManager.init();
export const cleanupStatistics = () => statisticsManager.cleanup();