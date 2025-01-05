// charts.js
let chartInstances = {};

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
    }
};

function createChartConfig(type = 'bar') {
    return {
        type,
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temps de Travail (minutes)',
                    data: [],
                    backgroundColor: chartConfig.colors.time.background,
                    borderColor: chartConfig.colors.time.border,
                    borderWidth: 1,
                    yAxisID: 'y-time'
                },
                {
                    label: 'Nombre de Comptages',
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
                        text: 'Temps (minutes)'
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
                        text: 'Comptages'
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
        console.error(`Pas de graphique trouvé pour la période ${period}`);
        return;
    }

    // Mettre à jour les données
    chart.data.labels = labels;
    chart.data.datasets[0].data = timeData;
    chart.data.datasets[1].data = countData;

    // Forcer la mise à jour du graphique
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
        console.error(`Canvas non trouvé pour ${period}`);
        return null;
    }

    const ctx = canvas.getContext('2d');
    const chart = new Chart(ctx, createChartConfig());
    console.log(`Graphique initialisé pour ${period}`);
    return chart;
}

// charts.js
export const ChartManager = {
    init() {
        if (typeof Chart === 'undefined') {
            throw new Error('Chart.js n\'est pas chargé !');
        }

        destroyCharts();
        ['daily', 'weekly', 'monthly', 'yearly'].forEach(period => {
            chartInstances[period] = initializeChart(period);
        });

        // Ajouter les écouteurs d'événements pour les toggles
        this.setupTaskDetailsToggle();

        window.addEventListener('resize', handleResize);
        return chartInstances;
    },

    // Ajouter cette méthode
    setupTaskDetailsToggle() {
        document.querySelectorAll('.toggle-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.closest('.chart-section').querySelector('.period-navigation').dataset.period;
                this.toggleTaskDetails(period);
            });
        });
    },

    // Ajouter cette méthode
    toggleTaskDetails(period) {
        const detailsSection = document.querySelector(`#${period}TaskDetails`);
        const button = detailsSection.nextElementSibling;
        const isExpanded = detailsSection.classList.toggle('expanded');
        
        const buttonText = button.querySelector('span');
        const buttonIcon = button.querySelector('svg');
        
        if (buttonText) {
            buttonText.textContent = isExpanded ? 'Masquer les détails' : 'Voir les détails';
        }
        if (buttonIcon) {
            buttonIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0)';
        }

        console.log(`Toggle details pour ${period}: ${isExpanded}`);
    },

    updateChart(period, labels, timeData, countData, taskDetails = []) {
        const chart = chartInstances[period];
        if (!chart) {
            console.error(`Pas de graphique trouvé pour la période ${period}`);
            return;
        }
    
        // Mise à jour du graphique
        chart.data.labels = labels;
        chart.data.datasets[0].data = timeData;
        chart.data.datasets[1].data = countData;
        chart.update('active');
    
        // Mise à jour du tableau des tâches
        const tbody = document.querySelector(`#${period}TaskDetails table tbody`);
        if (tbody) {
            console.log(`Mise à jour des détails des tâches pour ${period}:`, taskDetails);
            
            if (taskDetails && taskDetails.length > 0) {
                tbody.innerHTML = taskDetails.map(task => `
                    <tr>
                        <td>${task.name || 'Sans nom'}</td>
                        <td>${Math.round(parseFloat(task.total_time) / 60)}</td>
                        <td>${task.total_count}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center">Aucune donnée disponible</td></tr>';
            }
        }
    },

    destroy() {
        destroyCharts();
        window.removeEventListener('resize', handleResize);
    }
};