//--------------------Charts--------------------

// Variable globale pour stocker les instances de graphiques
let chartInstances = {}; 

async function fetchStatistics(period) {
    try {
        const response = await fetch(`http://localhost:3000/statistics/${period}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erreur HTTP pour ${period}:`, response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Données reçues pour ${period}:`, data);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la récupération des statistiques ${period}:`, error);
        return [];
    }
}

function checkAuthOnLoad() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found, redirecting to signup/login page');
        // Au lieu de rediriger vers une page séparée, nous allons afficher la page de connexion
        navigateTo('welcomepage');
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    if (checkAuthOnLoad()) {
        initializeCharts();
        updateCharts();
    }
});

function initializeCharts() {
    const periods = ['daily', 'weekly', 'monthly', 'yearly'];
    
    periods.forEach(period => {
        const ctx = document.getElementById(`${period}Chart`).getContext('2d');
        
        // Détruire le graphique existant s'il existe
        if (chartInstances[period]) {
            chartInstances[period].destroy();
        }
        
        chartInstances[period] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Temps de Travail (minutes)',
                        data: [],
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Nombre de Comptages',
                        data: [],
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            font: {
                                size: 24, // Augmentez cette valeur pour des dates plus grandes
                                weight: 'bold'
                            },

                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        }
                    },
                    title: {
                        display: true,
                        font: {
                            size: 20,
                            weight: 'bold'
                        }
                    },
                    tooltip: {
                        titleFont: {
                            size: 16,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    });

        // Ajouter un gestionnaire d'événement de redimensionnement
        window.addEventListener('resize', resizeAllCharts);
    
        // Appeler resizeAllCharts une fois pour définir la taille initiale
        resizeAllCharts();
}

function resizeAllCharts() {
    Object.values(chartInstances).forEach(chart => {
        resizeChart(chart);
    });

    function resizeChart(chart) {
        const wrapper = chart.canvas.parentNode;
        const padding = 40; // 20px de chaque côté
        const wrapperWidth = wrapper.clientWidth - padding;
        const wrapperHeight = wrapper.clientHeight - padding;
        
        chart.canvas.width = wrapperWidth;
        chart.canvas.height = wrapperHeight;
        chart.resize();
    }
}

async function updateCharts() {
    const periods = ['daily', 'weekly', 'monthly', 'yearly'];

    for (const period of periods) {
        try {
            const stats = await fetchStatistics(period);
            if (stats.length === 0) {
                console.log(`No data available for ${period} statistics`);
                // Optionally, update the chart to show "No data available"
                continue;
            }
            updateChart(chartInstances[period], stats, period);
        } catch (error) {
            console.error(`Error updating ${period} chart:`, error);
            // Optionally, update the chart to show an error message
        }
    }
}

function updateChart(chart, data, period) {
    if (!chart) {
        console.error(`Chart for ${period} not found`);
        return;
    }

    console.log(`Données reçues pour ${period}:`, data);

    if (!Array.isArray(data) || data.length === 0) {
        console.log(`Aucune donnée disponible pour ${period}`);
        chart.data.labels = [];
        chart.data.datasets.forEach((dataset) => {
            dataset.data = [];
        });
        chart.update();
        resizeChart(chart); 


        const labels = data.map(item => formatDate(item.date, period));

        chart.data.labels = labels;
        chart.options.plugins.tooltip = {
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += context.parsed.y;
                    }
                    return `<strong>${label}</strong>`;
                }
            }
        };
        chart.update();
        return;
    }

    const labels = data.map(item => {
        if (!item.date) {
            console.error('Date manquante pour l\'élément:', item);
            return 'Date invalide';
        }
        const formattedDate = formatDate(item.date, period);
        console.log(`Date originale: ${item.date}, Formattée: ${formattedDate}`);
        return formattedDate;
    });
    const totalTime = data.map(item => Math.round(Number(item.total_time) / 60)); // Convertir en minutes
    const totalCount = data.map(item => Number(item.total_count));

    chart.data.labels = labels;
    chart.data.datasets[0].data = totalTime;
    chart.data.datasets[1].data = totalCount;
    chart.update();
}

function formatDate(dateString, period) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.error('Date invalide:', dateString);
        return 'Date invalide';
    }

    let formattedDate;
    switch (period) {
        case 'daily':
            formattedDate = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
            break;
        case 'weekly':
            formattedDate = `Semaine du ${date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}`;
            break;
        case 'monthly':
            formattedDate = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
            break;
        case 'yearly':
            formattedDate = date.getFullYear().toString();
            break;
        default:
            formattedDate = date.toLocaleDateString('fr-FR');
    }

    return `${formattedDate}`;
}

function getWeekNumber(d) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));
    const yearStart = new Date(date.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}
