import { api } from './dynamicLoader.js';

// Variables globales
let surahs = [];
let currentSurahIndex = 0;
let revisionHistory = [];
let progressChart = null;
let performanceChart = null;

// Constantes
const levelColors = {
    'Strong': 'rgb(34, 197, 94)',    // Vert
    'Good': 'rgb(59, 130, 246)',      // Bleu
    'Moderate': 'rgb(234, 179, 8)',   // Jaune
    'Weak': 'rgb(239, 68, 68)'        // Rouge
};

// Références DOM
const navButtons = document.querySelectorAll('.quran-app-nav-button');
const sections = document.querySelectorAll('.quran-app-section');
const surahList = document.getElementById('surahmemorization-list');
const searchInput = document.getElementById('surahmemorization-search');
const filterSelect = document.getElementById('surahmemorization-filter');
const toggleAllBtn = document.getElementById('surahmemorization-toggle-all');
const selectedCountSpan = document.getElementById('surahmemorization-count');
const startRevisionBtn = document.getElementById('surahmemorization-start');
const currentSurahTitle = document.getElementById('surahmemorization-current-title');
const surahProgress = document.getElementById('surahmemorization-progress');
const surahText = document.getElementById('surahmemorization-text');
const toggleTextBtn = document.getElementById('surahmemorization-toggle-text');
const evaluationButtons = document.querySelectorAll('.surahmemorization-eval-btn');
const progressBarFill = document.querySelector('.surahmemorization-progress-bar-fill');
const historyFilter = document.getElementById('surahmemorization-history-filter');
const historyTable = document.getElementById('surahmemorization-history-table')?.querySelector('tbody');
const exportBtn = document.getElementById('surahmemorization-export');
const clearHistoryBtn = document.getElementById('surahmemorization-clear');
const saveButton = document.getElementById('surahmemorization-save');

// Fonctions utilitaires
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getLevelClass(level) {
    if (!level) return 'surahmemorization-level-na';
    return `surahmemorization-level-${level.toLowerCase()}`;
}

// Fonctions principales
async function loadSurahs() {
    try {
        const data = await api.get('/surah-memorization/surahs');
        surahs = data.surahs.map(surah => ({
            number: surah.number,
            name: surah.name,
            arabic: surah.arabic,
            memorizationLevel: surah.memorizationLevel || null,
            lastRevisionDate: surah.lastRevisionDate || null,
            isSelected: surah.isKnown
        }));

        renderSurahList();
        updateSelectedCount();
    } catch (error) {
        console.error('Error loading surahs:', error);
        alert('Une erreur s\'est produite lors du chargement des sourates.');
    }
}

function renderSurahList() {
    let container = document.getElementById('surahmemorization-list-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'surahmemorization-list-container';
        document.querySelector('#surahmemorization-select').appendChild(container);
        
        container.innerHTML = `
            <div class="surahmemorization-headers">
                <div class="header-left">
                    <span>Sourates</span>
                </div>
                <div class="header-center">
                    <span>Level</span>
                </div>
                <div class="header-right">
                    <span>Last Revised</span>
                </div>
            </div>
            <div id="surahmemorization-list"></div>
        `;
    }

    surahList.innerHTML = '';
    surahs.forEach(surah => {
        const surahItem = document.createElement('div');
        surahItem.className = 'surahmemorization-item';
        surahItem.innerHTML = `
            <div class="item-left">
                <input type="checkbox" id="surah-${surah.number}" ${surah.isSelected ? 'checked' : ''}>
                <label for="surah-${surah.number}">
                    <span class="surah-name">${surah.name}</span>
                    <span class="surah-number">(${surah.number})</span>
                </label>
            </div>
            <div class="item-center">
                <span class="memorization-level ${getLevelClass(surah.memorizationLevel)}">
                    ${surah.memorizationLevel || 'N/A'}
                </span>
            </div>
            <div class="item-right">
                ${formatDate(surah.lastRevisionDate)}
            </div>
        `;

        const checkbox = surahItem.querySelector('input');
        checkbox.addEventListener('change', async (e) => {
            surah.isSelected = e.target.checked;
            updateSelectedCount();

            try {
                await api.put(`/surah-memorization/surahs/${surah.number}`, {
                    isKnown: surah.isSelected
                });
                console.log(`Surah ${surah.number} updated to ${surah.isSelected ? 'known' : 'unknown'}.`);
            } catch (error) {
                console.error(`Erreur lors de la mise à jour de la sourate ${surah.number}:`, error);
                alert(`Une erreur s'est produite lors de la mise à jour de la sourate ${surah.number}.`);
                surah.isSelected = !surah.isSelected;
                checkbox.checked = surah.isSelected;
                updateSelectedCount();
            }
        });

        surahList.appendChild(surahItem);
    });
}

function updateSelectedCount() {
    const selectedCount = surahs.filter(surah => surah.isSelected).length;
    selectedCountSpan.textContent = `${selectedCount} surahs selected`;
    startRevisionBtn.disabled = selectedCount === 0;
}

function renderFilteredSurahList(filteredSurahs) {
    if (!surahList) return;
    surahList.innerHTML = '';
    filteredSurahs.forEach(surah => {
        const surahItem = document.createElement('div');
        surahItem.className = 'surahmemorization-item';
        surahItem.innerHTML = `
            <div class="item-left">
                <input type="checkbox" id="surah-${surah.number}" ${surah.isSelected ? 'checked' : ''}>
                <label for="surah-${surah.number}">
                    <span class="surah-name">${surah.name}</span>
                    <span class="surah-number">(${surah.number})</span>
                </label>
            </div>
            <div class="item-center">
                <span class="memorization-level ${getLevelClass(surah.memorizationLevel)}">
                    ${surah.memorizationLevel || 'N/A'}
                </span>
            </div>
            <div class="item-right">
                ${formatDate(surah.lastRevisionDate)}
            </div>
        `;

        const checkbox = surahItem.querySelector('input');
        checkbox.addEventListener('change', async (e) => {
            surah.isSelected = e.target.checked;
            updateSelectedCount();

            try {
                await api.put(`/surah-memorization/surahs/${surah.number}`, {
                    isKnown: surah.isSelected
                });
            } catch (error) {
                console.error(`Erreur lors de la mise à jour de la sourate ${surah.number}:`, error);
                alert(`Une erreur s'est produite lors de la mise à jour de la sourate ${surah.number}.`);
                surah.isSelected = !surah.isSelected;
                checkbox.checked = surah.isSelected;
                updateSelectedCount();
            }
        });

        surahList.appendChild(surahItem);
    });
}

function renderCurrentSurah() {
    const currentSurah = surahs[currentSurahIndex];
    currentSurahTitle.textContent = currentSurah.name;
    surahProgress.textContent = `Sourate ${currentSurahIndex + 1} sur ${surahs.length}`;
    surahText.textContent = currentSurah.text;
    surahText.style.display = 'none';
    toggleTextBtn.innerHTML = '<span class="icon">👁</span> Show Text';

    const progressPercentage = ((currentSurahIndex + 1) / surahs.length) * 100;
    progressBarFill.style.width = `${progressPercentage}%`;
}

async function renderHistoryCharts() {
    const ctx1 = document.getElementById('surahmemorization-progress-chart')?.getContext('2d');
    const ctx2 = document.getElementById('surahmemorization-performance-chart')?.getContext('2d');
    
    if (!ctx1 || !ctx2) return;

    try {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js n\'est pas chargé');
            return;
        }

        const data = await api.get('/surah-memorization/history');
        const historyData = data.history;

        if (!historyData || historyData.length === 0) {
            console.warn('Aucune donnée d\'historique disponible.');
            return;
        }

        if (progressChart) progressChart.destroy();
        if (performanceChart) performanceChart.destroy();

        progressChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: historyData.map(entry => entry.name),
                datasets: [{
                    label: 'Date de la Dernière Révision',
                    data: historyData.map(entry => new Date(entry.lastRevisionDate).getTime()),
                    backgroundColor: historyData.map(entry => levelColors[entry.memorizationLevel] || 'rgba(201, 203, 207, 0.6)'),
                    borderColor: historyData.map(entry => levelColors[entry.memorizationLevel] || 'rgba(201, 203, 207, 1)'),
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: { 
                        title: { display: true, text: 'Sourate' } 
                    },
                    y: { 
                        title: { display: true, text: 'Timestamp' },
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                const date = new Date(value);
                                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const date = new Date(context.parsed.y);
                                return `Date de Révision: ${date.toLocaleDateString()}`;
                            }
                        }
                    }
                }
            }
        });

        const levelCounts = historyData.reduce((acc, entry) => {
            const level = entry.memorizationLevel || 'N/A';
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});

        performanceChart = new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: Object.keys(levelCounts),
                datasets: [{
                    data: Object.values(levelCounts),
                    backgroundColor: Object.keys(levelCounts).map(level => levelColors[level]),
                    borderColor: Object.keys(levelCounts).map(level => 'rgba(255, 255, 255, 1)'),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading history:', error);
        alert('Une erreur s\'est produite lors du chargement de l\'historique.');
    }
}

async function renderHistoryTable() {
    if (!historyTable) return;
    
    historyTable.innerHTML = '';
    try {
        const data = await api.get('/surah-memorization/history');
        const historyData = data.history;

        historyData.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.name}</td>
                <td>${entry.number}</td>
                <td>${formatDate(entry.lastRevisionDate)}</td>
                <td class="${getLevelClass(entry.memorizationLevel)}">${entry.memorizationLevel || 'N/A'}</td>
                <td>${formatDate(entry.nextRevisionDate)}</td>
            `;
            historyTable.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading history:', error);
        alert('Une erreur s\'est produite lors du chargement du tableau d\'historique.');
    }
}

function initSurahMemorization() {
    document.getElementById('surahmemorization-select').style.display = 'block';
    document.getElementById('surahmemorization-revise').style.display = 'none';
    document.getElementById('surahmemorization-history').style.display = 'none';
    loadSurahs();
}

// Event Listeners
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetSection = button.dataset.target;
        sections.forEach(section => {
            section.style.display = section.id === `surahmemorization-${targetSection}` ? 'block' : 'none';
        });
        if (targetSection === 'history') {
            renderHistoryCharts();
            renderHistoryTable();
        }
    });
});

saveButton?.addEventListener('click', async () => {
    const selectedSurahs = surahs.filter(surah => surah.isSelected).map(surah => surah.number);
    if (selectedSurahs.length === 0) {
        alert('Veuillez sélectionner au moins une sourate à enregistrer.');
        return;
    }

    try {
        await api.post('/surah-memorization/known', { sourates: selectedSurahs });
        alert('Sourates connues enregistrées avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des sourates connues:', error);
        alert('Une erreur s\'est produite lors de l\'enregistrement des sourates connues.');
    }
});

searchInput?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredSurahs = surahs.filter(surah =>
        surah.name.toLowerCase().includes(searchTerm) ||
        surah.number.toString().includes(searchTerm)
    );
    renderFilteredSurahList(filteredSurahs);
});

filterSelect?.addEventListener('change', (e) => {
    const filterValue = e.target.value;
    let filteredSurahs = [...surahs];

    switch (filterValue) {
        case 'memorization':
            filteredSurahs.sort((a, b) => {
                const levels = { 'Strong': 1, 'Good': 2, 'Moderate': 3, 'Weak': 4, 'N/A': 5 };
                return (levels[a.memorizationLevel || 'N/A'] - levels[b.memorizationLevel || 'N/A']);
            });
            break;
        case 'alphabetical':
            filteredSurahs.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'numerical':
            filteredSurahs.sort((a, b) => a.number - b.number);
            break;
    }
    renderFilteredSurahList(filteredSurahs);
});

toggleAllBtn?.addEventListener('click', async () => {
    const allSelected = surahs.every(surah => surah.isSelected);
    for (const surah of surahs) {
        surah.isSelected = !allSelected;
        try {
            await api.put(`/surah-memorization/surahs/${surah.number}`, {
                isKnown: surah.isSelected
            });
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de la sourate ${surah.number}:`, error);
            alert(`Une erreur s'est produite lors de la mise à jour de la sourate ${surah.number}.`);
            surah.isSelected = !surah.isSelected;
        }
    }
    renderSurahList();
    updateSelectedCount();
});

startRevisionBtn?.addEventListener('click', () => {
    const selectedSurahs = surahs.filter(surah => surah.isSelected);
    if (selectedSurahs.length === 0) {
        alert('Veuillez sélectionner au moins une sourate à réviser.');
        return;
    }

    const shuffledSurahs = shuffleArray(selectedSurahs.slice());
    currentSurahIndex = 0;
    surahs = shuffledSurahs;

    document.getElementById('surahmemorization-revise').style.display = 'block';
    document.getElementById('surahmemorization-select').style.display = 'none';

    renderCurrentSurah();
});

toggleTextBtn?.addEventListener('click', () => {
    if (surahText.style.display === 'none') {
        surahText.style.display = 'block';
        toggleTextBtn.innerHTML = '<span class="icon">👁</span> Hide Text';
    } else {
        surahText.style.display = 'none';
        toggleTextBtn.innerHTML = '<span class="icon">👁</span> Show Text';
    }
});

evaluationButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const level = button.dataset.level;
        const currentSurah = surahs[currentSurahIndex];
        currentSurah.memorizationLevel = level;
        currentSurah.lastRevisionDate = new Date().toISOString().split('T')[0];
        revisionHistory.push({
            ...currentSurah,
            revisionDate: currentSurah.lastRevisionDate
        });

        try {
            await api.post(`/surah-memorization/surahs/${currentSurah.number}`, {
                memorizationLevel: level,
                lastRevisionDate: currentSurah.lastRevisionDate
            });
        } catch (error) {
            console.error('Error updating surah:', error);
            alert('Une erreur s\'est produite lors de la mise à jour de la sourate.');
            return;
        }

        if (currentSurahIndex < surahs.length - 1) {
            currentSurahIndex++;
            renderCurrentSurah();
        } else {
            alert('Révision terminée !');
            document.getElementById('surahmemorization-revise').style.display = 'none';
            document.getElementById('surahmemorization-history').style.display = 'block';
            renderHistoryCharts();
            renderHistoryTable();
        }
    });
});

historyFilter?.addEventListener('change', (e) => {
    const filter = e.target.value.toLowerCase();
    const rows = historyTable.querySelectorAll('tr');
    rows.forEach(row => {
        const level = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        row.style.display = (filter === 'all' || level === filter) ? '' : 'none';
    });
});

exportBtn?.addEventListener('click', async () => {
    try {
        const data = await api.get('/surah-memorization/history');
        const historyData = data.history;

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Surah Name,Number,Revision Date,Level,Next Revision\n"
            + historyData.map(entry => `${entry.name},${entry.number},${entry.lastRevisionDate},${entry.memorizationLevel || 'N/A'},${entry.nextRevisionDate || 'N/A'}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "revision_history.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Une erreur s\'est produite lors de l\'exportation des données.');
    }
});

clearHistoryBtn?.addEventListener('click', async () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique de révision ? Cette action est irréversible.')) {
        try {
            await api.delete('/surah-memorization/history');
            revisionHistory = [];
            renderHistoryTable();
            renderHistoryCharts();
            alert('Historique réinitialisé avec succès.');
        } catch (error) {
            console.error('Error clearing history:', error);
            alert('Une erreur s\'est produite lors de la réinitialisation de l\'historique.');
        }
    }
});

export { initSurahMemorization };