// charts.js
let chartInstances = {};

// Translations object
const translations = {
    fr: {
        workTime: 'Temps de Travail (minutes)',
        countNumber: 'Nombre de Comptages',
        time: 'Temps (minutes)',
        counts: 'Comptages',
        viewDetails: 'Voir les détails',
        hideDetails: 'Masquer les détails',
        noData: 'Aucune donnée disponible',
        unnamed: 'Sans nom',
        task: 'Tâche',
        timeMinutes: 'Temps (min)',
        dailyStats: 'Statistiques Journalières',
        weeklyStats: 'Statistiques Hebdomadaires',
        monthlyStats: 'Statistiques Mensuelles',
        yearlyStats: 'Statistiques Annuelles',
        january: 'janvier',
        february: 'février',
        march: 'mars',
        april: 'avril',
        may: 'mai',
        june: 'juin',
        july: 'juillet',
        august: 'août',
        september: 'septembre',
        october: 'octobre',
        november: 'novembre',
        december: 'décembre',
        week: 'Semaine du',
        noDataAvailable: 'Aucune donnée disponible'
    },
    en: {
        workTime: 'Working Time (minutes)',
        countNumber: 'Number of Counts',
        time: 'Time (minutes)',
        counts: 'Counts',
        viewDetails: 'View details',
        hideDetails: 'Hide details',
        noData: 'No data available',
        unnamed: 'Unnamed',
        task: 'Task',
        timeMinutes: 'Time (min)',
        dailyStats: 'Daily Statistics',
        weeklyStats: 'Weekly Statistics',
        monthlyStats: 'Monthly Statistics',
        yearlyStats: 'Yearly Statistics',
        january: 'January',
        february: 'February',
        march: 'March',
        april: 'April',
        may: 'May',
        june: 'June',
        july: 'July',
        august: 'August',
        september: 'September',
        october: 'October',
        november: 'November',
        december: 'December',
        week: 'Week of',
        noDataAvailable: 'No data available'
    }
};

function translateChartLabels(labels) {
    const currentLang = getCurrentLanguage();
    return labels.map(label => {
        // Si c'est une date
        if (typeof label === 'string' && 
           (label.includes('janvier') || 
            label.includes('Semaine du') || 
            label.includes('January') || 
            label.includes('Week of'))) {
            
            // Extraire la date
            const dateParts = label.split(' ');
            let year = dateParts[dateParts.length - 1];
            let day;
            
            if (label.includes('Semaine du') || label.includes('Week of')) {
                day = dateParts[2];
            } else {
                day = dateParts[0];
            }

            // Créer un objet Date
            const date = new Date(`${year}-01-${day}`);

            // Formater selon le type de label
            if (label.includes('Semaine du') || label.includes('Week of')) {
                return formatWeekPeriod(date);
            } else {
                return formatDate(date);
            }
        }
        return label;
    });
}

function getCurrentLanguage() {
    const currentPath = window.location.pathname;
    const storedLang = localStorage.getItem('userLang');
    
    console.log('Current path:', currentPath);
    console.log('Stored language:', storedLang);
    console.log('Browser language:', navigator.language);
    
    if (currentPath.includes('index-fr.html') || currentPath.includes('/fr/')) {
        console.log('Language detected from path: fr');
        return 'fr';
    }
    if (currentPath.includes('index-en.html') || currentPath.includes('/en/')) {
        console.log('Language detected from path: en');
        return 'en';
    }
    
    if (storedLang === 'fr' || storedLang === 'en') {
        console.log('Language detected from localStorage:', storedLang);
        return storedLang;
    }
    
    const defaultLang = (navigator.language || navigator.userLanguage).startsWith('fr') ? 'fr' : 'en';
    console.log('Default language selected:', defaultLang);
    return defaultLang;
}

function getTranslation(key) {
    const currentLang = getCurrentLanguage();
    return translations[currentLang][key] || key;
}

const chartConfig = {
    colors: {
        time: {
            background: 'rgba(54, 162, 235, 0.6)',
            border: 'rgba(54, 162, 235, 1)'
        },
        count: {
            background: 'rgba(75, 192, 192, 0.6)',
            border: 'rgba(75, 192, 192, 1)'
        }
    },
    dimensions: {
        defaultHeight: '300px',
        expandedHeight: '200px'
    }
};

function getMonthKey(monthIndex) {
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                   'july', 'august', 'september', 'october', 'november', 'december'];
    return months[monthIndex];
}

function formatDate(date) {
    const currentLang = getCurrentLanguage();
    console.log('formatDate - Language:', currentLang);
    console.log('formatDate - Input date:', date);
    
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // Get month translation
    const monthKey = getMonthKey(month);
    console.log('formatDate - Month key:', monthKey);
    
    const monthName = getTranslation(monthKey);
    console.log('formatDate - Translated month:', monthName);
    
    let result = '';
    if (currentLang === 'fr') {
        result = `${day} ${monthName.toLowerCase()} ${year}`;
    } else {
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        result = `${capitalizedMonth} ${day}, ${year}`;
    }
    
    console.log('formatDate - Final result:', result);
    return result;
}

function formatMonthYear(date) {
    const currentLang = getCurrentLanguage();
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthName = getTranslation(getMonthKey(month));
    
    if (currentLang === 'fr') {
        return `${monthName.toLowerCase()} ${year}`;
    } else {
        return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
    }
}

function formatWeekPeriod(date) {
    const currentLang = getCurrentLanguage();
    console.log('formatWeekPeriod - Language:', currentLang);
    console.log('formatWeekPeriod - Input date:', date);
    
    // Format date first
    const formattedDate = formatDate(date);
    console.log('formatWeekPeriod - Formatted date:', formattedDate);
    
    // Get translation for 'week'
    const weekText = getTranslation('week');
    console.log('formatWeekPeriod - Week text:', weekText);
    
    // Combine them
    const result = `${weekText} ${formattedDate}`;
    console.log('formatWeekPeriod - Final result:', result);
    
    return result;
}

function createChartConfig(type = 'bar') {
    return {
        type,
        data: {
            labels: [],
            datasets: [
                {
                    label: getTranslation('workTime'),
                    data: [],
                    backgroundColor: chartConfig.colors.time.background,
                    borderColor: chartConfig.colors.time.border,
                    borderWidth: 1,
                    yAxisID: 'y-time'
                },
                {
                    label: getTranslation('countNumber'),
                    data: [],
                    backgroundColor: chartConfig.colors.count.background,
                    borderColor: chartConfig.colors.count.border,
                    borderWidth: 1,
                    yAxisID: 'y-count'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 500
            },
            scales: {
                'y-time': {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: getTranslation('time')
                    }
                },
                'y-count': {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: getTranslation('counts')
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    };
}

function updateChartData(period, labels, timeData, countData) {
    const chart = chartInstances[period];
    if (!chart) {
        console.error(`No chart found for period ${period}`);
        return;
    }

    // Ajout de la traduction des labels ici
    const formattedLabels = labels.map(label => {
        if (label.includes('-')) {
            const date = new Date(label);
            const formattedDate = formatDate(date);
            return getCurrentLanguage() === 'fr' ? 
                   formattedDate.toLowerCase() : 
                   formattedDate;
        }
        return label;
    });

    chart.data.labels = formattedLabels;
    chart.data.datasets[0].data = timeData;
    chart.data.datasets[1].data = countData;
    chart.update('active');
}

function destroyCharts() {
    Object.values(chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });
    chartInstances = {};
}

function handleResize() {
    Object.values(chartInstances).forEach(chart => {
        if (chart?.canvas) chart.resize();
    });
}

function initializeChart(period) {
    const canvas = document.getElementById(`${period}Chart`);
    if (!canvas) {
        console.error(`Canvas not found for ${period}`);
        return null;
    }

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, createChartConfig());
    console.log(`Chart initialized for ${period}`);
    return chart;
}

export const ChartManager = {
    init() {
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js is not loaded!');
        }

        destroyCharts();
        ['daily', 'weekly', 'monthly', 'yearly'].forEach(period => {
            chartInstances[period] = initializeChart(period);
        });

        this.setupTaskDetailsToggle();
        this.updateAllChartLabels();
        this.updatePeriodTitles();
        
        window.addEventListener('resize', handleResize);
        document.addEventListener('languageChanged', (event) => {
            this.updateAllChartLabels();
            this.updatePeriodTitles();
        });

        return chartInstances;
    },

    setupTaskDetailsToggle() {
        document.querySelectorAll('.toggle-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartSection = e.target.closest('.chart-section');
                const period = chartSection.querySelector('.period-navigation').dataset.period;
                this.toggleTaskDetails(chartSection, period);
            });
        });
    },

    updateAllChartLabels() {
        // Mettre à jour les textes avec data-action
        document.querySelectorAll('[data-action]').forEach(element => {
            const key = element.getAttribute('data-action');
            if (translations[getCurrentLanguage()][key]) {
                element.textContent = getTranslation(key);
            }
        });

        // Mettre à jour les graphiques
        Object.entries(chartInstances).forEach(([period, chart]) => {
            if (chart) {
                chart.data.datasets[0].label = getTranslation('workTime');
                chart.data.datasets[1].label = getTranslation('countNumber');
                
                chart.options.scales['y-time'].title.text = getTranslation('time');
                chart.options.scales['y-count'].title.text = getTranslation('counts');
                
                // Reformater les labels de date si nécessaire
                if (chart.data.labels.length > 0) {
                    chart.data.labels = chart.data.labels.map(label => {
                        if (label.includes('-') || label.includes('/')) {
                            const date = new Date(label);
                            return formatDate(date);
                        }
                        return label;
                    });
                }
                
                chart.update('none');
            }
        });
    },

    toggleTaskDetails(chartSection, period) {
        const isExpanded = chartSection.classList.toggle('details-visible');
        
        const button = chartSection.querySelector('.toggle-details-btn');
        const buttonText = button.querySelector('span');
        const buttonIcon = button.querySelector('svg');
        
        buttonText.textContent = isExpanded ? 
            getTranslation('hideDetails') : 
            getTranslation('viewDetails');
        buttonIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0)';
        
        const chartWrapper = chartSection.querySelector('.chart-wrapper');
        void chartWrapper.offsetWidth;
        
        setTimeout(() => {
            const chart = chartInstances[period];
            if (chart) {
                chart.resize();
                chart.update('none');
            }
        }, 300);
    },

    updateChart(period, labels, timeData, countData, taskDetails = []) {
        const chart = chartInstances[period];
        if (!chart) return;
    
        // Traduire les labels
        const translatedLabels = translateChartLabels(labels);
        
        chart.data.labels = translatedLabels;
        chart.data.datasets[0].data = timeData;
        chart.data.datasets[1].data = countData;
        chart.update('active');
    
        const tbody = document.querySelector(`#${period}TaskDetails table tbody`);
        if (tbody) {
            if (taskDetails && taskDetails.length > 0) {
                tbody.innerHTML = taskDetails.map(task => `
                    <tr>
                        <td>${task.name || getTranslation('unnamed')}</td>
                        <td>${Math.round(parseFloat(task.total_time) / 60)}</td>
                        <td>${task.total_count}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="3" class="text-center">${getTranslation('noDataAvailable')}</td></tr>`;
            }
        }
    
        // Force la mise à jour des titres
        this.updatePeriodTitles();
    },

    updatePeriodTitles() {
        console.log('Updating period titles...');
        const periodDisplays = document.querySelectorAll('.period-display');
        periodDisplays.forEach(display => {
            const dateAttr = display.getAttribute('data-date');
            console.log('Processing display element:', {
                dateAttr,
                currentText: display.textContent
            });
            
            if (dateAttr) {
                const date = new Date(dateAttr);
                const period = display.closest('.period-navigation').dataset.period;
                
                console.log('Processing date for period:', {
                    date,
                    period,
                    currentLanguage: getCurrentLanguage()
                });
                
                let newText;
                switch(period) {
                    case 'weekly':
                        newText = formatWeekPeriod(date);
                        break;
                    case 'monthly':
                        newText = formatMonthYear(date);
                        break;
                    case 'yearly':
                        newText = date.getFullYear().toString();
                        break;
                    default:
                        newText = formatDate(date);
                }
                
                console.log('Updated text:', newText);
                display.textContent = newText;
            }
        });
    },

    destroy() {
        destroyCharts();
        window.removeEventListener('resize', handleResize);
    }
};