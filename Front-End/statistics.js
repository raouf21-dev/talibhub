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

    validateData(data, period) {
        if (!data?.data || !Array.isArray(data.data)) {
            console.error(`[Frontend] Format de données invalide pour ${period}`);
            return [];
        }

        return data.data.map(item => ({
            date: item.date,
            total_time: Number(item.total_time) || 0,
            total_count: Number(item.total_count) || 0,
            task_details: Array.isArray(item.task_details) ? item.task_details : []
        }));
    }

    async fetchStatisticsData(period) {
        try {
            console.log(`[Frontend] Début fetchStatisticsData pour ${period}`);
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('[Frontend] Pas de token trouvé');
                return null;
            }

            console.log(`[Frontend] Envoi requête API pour ${period}`);
            const response = await fetch(`/api/statistics/${period}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Erreur HTTP! statut: ${response.status}`);
            }

            const validatedData = this.validateData(result, period);
            
            console.log(`[Frontend] Données reçues pour ${period}:`, {
                nombreDonnées: validatedData.length,
                données: JSON.stringify(validatedData, null, 2)
            });

            if (validatedData.length > 0) {
                this.currentData[period] = validatedData;
                console.log(`[Frontend] currentData mis à jour pour ${period}:`, 
                    JSON.stringify(this.currentData[period], null, 2));

                const sortedData = [...validatedData].sort((a, b) => new Date(b.date) - new Date(a.date));
                
                this.latestRecords[period] = new Date(sortedData[0].date);
                this.earliestRecords[period] = new Date(sortedData[sortedData.length - 1].date);

                console.log(`[Frontend] Limites temporelles pour ${period}:`, {
                    dernièreDate: this.latestRecords[period],
                    premièreDate: this.earliestRecords[period],
                    nombreTotal: sortedData.length
                });
            }

            return validatedData;
        } catch (error) {
            this.handleError(error, `fetchStatisticsData(${period})`);
            return [];
        }
    }

    getDataForCurrentPeriod(period) {
        console.log(`[Frontend] Début getDataForCurrentPeriod pour ${period}`);
        const currentDate = new Date(this.currentPeriods[period]);
        currentDate.setHours(0, 0, 0, 0);
        const data = this.currentData[period];
    
        if (!data || !data.length) {
            console.log(`[Frontend] Pas de données disponibles pour ${period}`);
            return null;
        }
    
        const isInCurrentPeriod = (dateStr) => {
            const date = new Date(dateStr);
            date.setHours(0, 0, 0, 0);
            
            console.log(`[Frontend] Comparaison de dates pour ${period}:`, {
                date: date,
                currentDate: currentDate
            });
    
            switch(period) {
                case 'daily': {
                    return date.getTime() === currentDate.getTime();
                }
                case 'weekly': {
                    const weekStart = new Date(currentDate);
                    const day = currentDate.getDay() || 7;
                    weekStart.setDate(currentDate.getDate() - day + 1);
                    weekStart.setHours(0, 0, 0, 0);
    
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
    
                    return date >= weekStart && date <= weekEnd;
                }
                case 'monthly': {
                    return date.getMonth() === currentDate.getMonth() &&
                           date.getFullYear() === currentDate.getFullYear();
                }
                case 'yearly': {
                    return date.getFullYear() === currentDate.getFullYear();
                }
            }
            return false;
        };
    
        const filteredData = data.filter(item => {
            const matches = isInCurrentPeriod(item.date);
            console.log(`[Frontend] Filtrage pour ${item.date}:`, matches);
            return matches;
        });
    
        if (filteredData.length === 0) {
            console.log(`[Frontend] Aucune donnée pour ${period} à la date ${currentDate}`);
            return null;
        }
    
        return filteredData.reduce((acc, curr) => {
            if (!acc) return curr;
            return {
                date: curr.date,
                total_time: Number(acc.total_time) + Number(curr.total_time),
                total_count: Number(acc.total_count) + Number(curr.total_count),
                task_details: [...(acc.task_details || []), ...(curr.task_details || [])]
            };
        }, null);
    }

    async updatePeriodData(period) {
        try {
            console.log(`[Frontend] Début updatePeriodData pour ${period}`);

            if (!this.currentData[period].length) {
                await this.fetchStatisticsData(period);
            }

            const currentPeriodData = this.getDataForCurrentPeriod(period);

            if (currentPeriodData) {
                const labels = [this.formatPeriodLabel(this.currentPeriods[period], period)];
                const timeData = [Math.round(currentPeriodData.total_time / 60)];
                const countData = [currentPeriodData.total_count];

                console.log(`[Frontend] Mise à jour du graphique ${period}:`, {
                    labels,
                    timeData,
                    countData,
                    taskDetails: currentPeriodData.task_details
                });

                ChartManager.updateChart(
                    period,
                    labels,
                    timeData,
                    countData,
                    currentPeriodData.task_details || []
                );
            } else {
                console.log(`[Frontend] Pas de données à afficher pour ${period}`);
                ChartManager.updateChart(period, ['Pas de données'], [0], [0], []);
            }

            this.updatePeriodDisplay(period);
            this.updateNavigationButtons(period);
        } catch (error) {
            this.handleError(error, `updatePeriodData(${period})`);
        }
    }

    isNavigationAllowed(period, direction) {
        const currentDate = this.currentPeriods[period];
        const latestRecord = this.latestRecords[period];
        const earliestRecord = this.earliestRecords[period];
    
        if (!latestRecord || !earliestRecord) return false;
    
        const normalizedCurrent = new Date(currentDate);
        const normalizedLatest = new Date(latestRecord);
        const normalizedEarliest = new Date(earliestRecord);
        
        [normalizedCurrent, normalizedLatest, normalizedEarliest].forEach(date => 
            date.setHours(0, 0, 0, 0)
        );
    
        console.log(`[Frontend] Vérification navigation pour ${period}:`, {
            direction,
            courante: normalizedCurrent,
            dernière: normalizedLatest,
            première: normalizedEarliest
        });
    
        return direction > 0 
            ? normalizedCurrent < normalizedLatest
            : normalizedCurrent > normalizedEarliest;
    }

    setupNavigationListeners() {
        document.querySelectorAll('.period-navigation').forEach(nav => {
            const period = nav.dataset.period;
            nav.querySelector('.prev')?.addEventListener('click', () => 
                this.navigatePeriod(period, -1)
            );
            nav.querySelector('.next')?.addEventListener('click', () => 
                this.navigatePeriod(period, 1)
            );
        });
        console.log('[Frontend] Écouteurs de navigation configurés');
    }

    updateNavigationButtons(period) {
        const nav = document.querySelector(`[data-period="${period}"]`);
        if (!nav) return;

        const nextBtn = nav.querySelector('.next');
        const prevBtn = nav.querySelector('.prev');

        if (!nextBtn || !prevBtn) return;

        const nextAllowed = this.isNavigationAllowed(period, 1);
        const prevAllowed = this.isNavigationAllowed(period, -1);

        nextBtn.disabled = !nextAllowed;
        prevBtn.disabled = !prevAllowed;

        nextBtn.classList.toggle('disabled', !nextAllowed);
        prevBtn.classList.toggle('disabled', !prevAllowed);

        console.log(`[Frontend] État des boutons de navigation pour ${period}:`, {
            suivant: nextAllowed ? 'activé' : 'désactivé',
            précédent: prevAllowed ? 'activé' : 'désactivé'
        });
    }

    navigatePeriod(period, direction) {
        console.log(`[Frontend] Navigation ${period} direction ${direction}`);
        
        if (!this.isNavigationAllowed(period, direction)) {
            console.log(`[Frontend] Navigation bloquée`);
            return;
        }
    
        const newDate = new Date(this.currentPeriods[period]);
        
        switch(period) {
            case 'daily':
                newDate.setDate(newDate.getDate() + direction);
                break;
            case 'weekly':
                newDate.setDate(newDate.getDate() + direction * 7);
                break;
            case 'monthly':
                newDate.setMonth(newDate.getMonth() + direction);
                break;
            case 'yearly':
                newDate.setFullYear(newDate.getFullYear() + direction);
                break;
        }
    
        this.currentPeriods[period] = newDate;
        this.updatePeriodDisplay(period);
        this.updatePeriodData(period);
    }

    formatPeriodLabel(dateStr, period) {
        const date = new Date(dateStr);
        return this.formatDate(date, period);
    }

    formatDate(date, period) {
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
        
        const formattedDate = this.formatPeriodLabel(this.currentPeriods[period], period);
        console.log(`[Frontend] Mise à jour affichage période ${period}:`, formattedDate);
        display.textContent = formattedDate;
    }

    setupAutoRefresh() {
        return setInterval(() => {
            console.log('[Frontend] Rafraîchissement automatique des données');
            ['daily', 'weekly', 'monthly', 'yearly'].forEach(period => 
                this.updatePeriodData(period)
            );
        }, 300000); // 5 minutes
    }

    cleanup() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        ChartManager.destroy();
        this.initialized = false;
        console.log('[Frontend] Nettoyage effectué');
    }

    handleError(error, context) {
        console.error(`[Frontend] Erreur dans ${context}:`, error);
        // Possibilité d'ajouter un système de notification ici
    }

    async init() {
        if (this.initialized) {
            console.log('[Frontend] Déjà initialisé');
            return;
        }

        try {
            console.log('[Frontend] Initialisation...');
            
            ChartManager.init();
            
            await Promise.all([
                'daily', 'weekly', 'monthly', 'yearly'
            ].map(period => this.updatePeriodData(period)));

            this.setupNavigationListeners();
            this.refreshInterval = this.setupAutoRefresh();

            this.initialized = true;
            console.log('[Frontend] Initialisation terminée avec succès');
        } catch (error) {
            this.handleError(error, 'init');
            this.initialized = false;
            ChartManager.destroy();
            throw error;
        }
    }
}

const statisticsManager = new StatisticsManager();

export const initializeStatistics = async () => {
    try {
        await statisticsManager.init();
        console.log('[Frontend] Statistiques initialisées');
    } catch (error) {
        console.error('[Frontend] Erreur d\'initialisation:', error);
        throw error;
    }
};

export const cleanupStatistics = () => {
    try {
        statisticsManager.cleanup();
        console.log('[Frontend] Nettoyage effectué');
    } catch (error) {
        console.error('[Frontend] Erreur de nettoyage:', error);
    }
};

export const StatisticsManagerInstance = statisticsManager;