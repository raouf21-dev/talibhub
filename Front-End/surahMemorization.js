// surahMemorization.js

let surahs = [];
let currentSurahIndex = 0;
let revisionHistory = [];

// DOM Elements
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
const prevSurahBtn = document.getElementById('surahmemorization-prev');
const nextSurahBtn = document.getElementById('surahmemorization-next');
const skipBtn = document.getElementById('surahmemorization-skip');
const progressBarFill = document.querySelector('.surahmemorization-progress-bar-fill');
const historyFilter = document.getElementById('surahmemorization-history-filter');
const historyTable = document.getElementById('surahmemorization-history-table').querySelector('tbody');
const exportBtn = document.getElementById('surahmemorization-export');
const clearHistoryBtn = document.getElementById('surahmemorization-clear');

// Base URL de votre API backend
const API_BASE_URL = 'http://localhost:3000'; // Remplacez par l'URL appropriée

// Récupérer le token d'authentification depuis le stockage local
const token = localStorage.getItem('token');

// Fonction pour faire des requêtes API avec le token
async function apiRequest(endpoint, method = 'GET', data = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  const options = {
    method,
    headers
  };
  if (data) {
    options.body = JSON.stringify(data);
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

// Navigation
navButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetSection = button.id.split('-')[3];
    sections.forEach(section => {
      section.style.display = section.id === `surahmemorization-${targetSection}` ? 'block' : 'none';
    });
    if (targetSection === 'history') {
      renderHistoryCharts();
      renderHistoryTable();
    }
  });
});

// Fonction pour charger les sourates depuis le backend
async function loadSurahs() {
    try {
      // Récupérer toutes les sourates
      const allSurahs = await apiRequest('/sourates/');
  
      // Récupérer les sourates connues par l'utilisateur avec leurs niveaux de mémorisation
      const knownSurahs = await apiRequest('/sourates/memorization-status');
  
      // Créer un objet pour un accès rapide aux niveaux de mémorisation
      const memorizationStatusMap = {};
      knownSurahs.forEach(surah => {
        memorizationStatusMap[surah.sourate_number] = {
          memorizationLevel: surah.memorization_level,
          lastRevisionDate: surah.last_revision_date
        };
      });
  
      // Construire la liste des sourates avec les informations de mémorisation
      surahs = allSurahs.map(surah => {
        const memorizationInfo = memorizationStatusMap[surah.number] || {};
        return {
          number: surah.number,
          name: surah.name,
          arabic: surah.arabic,
          memorizationLevel: memorizationInfo.memorizationLevel || null,
          lastRevisionDate: memorizationInfo.lastRevisionDate || null,
          isSelected: false
        };
      });
  
      renderSurahList();
      updateSelectedCount();
    } catch (error) {
      console.error('Error loading surahs:', error);
    }
  }

  const saveButton = document.getElementById('surahmemorization-save');

saveButton.addEventListener('click', async () => {
  const selectedSurahs = surahs.filter(surah => surah.isSelected).map(surah => surah.number);
  if (selectedSurahs.length === 0) {
    alert('Veuillez sélectionner au moins une sourate à enregistrer.');
    return;
  }

  try {
    // Envoyer les sourates sélectionnées au backend pour les enregistrer
    await apiRequest('/surah-memorization/known', 'POST', { sourates: selectedSurahs });
    alert('Sourates connues enregistrées avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des sourates connues:', error);
    alert('Une erreur s\'est produite lors de l\'enregistrement des sourates connues.');
  }
});
  
  

// Select Surahs Section
function renderSurahList() {
  surahList.innerHTML = '';
  surahs.forEach(surah => {
    const surahItem = document.createElement('div');
    surahItem.className = 'surahmemorization-item';
    surahItem.innerHTML = `
      <input type="checkbox" id="surah-${surah.number}" ${surah.isSelected ? 'checked' : ''}>
      <label for="surah-${surah.number}">
        <span class="surahmemorization-name">${surah.name}</span>
        <span class="surahmemorization-number">(${surah.number})</span>
      </label>
      <span class="surahmemorization-level ${getLevelClass(surah.memorizationLevel)}">${surah.memorizationLevel || 'N/A'}</span>
      <span class="surahmemorization-last-revision">Last revised: ${surah.lastRevisionDate || 'N/A'}</span>
    `;
    surahList.appendChild(surahItem);

    surahItem.querySelector('input').addEventListener('change', (e) => {
      surah.isSelected = e.target.checked;
      updateSelectedCount();
    });
  });
}

function getLevelClass(level) {
  if (!level) return 'surahmemorization-level-na';
  return `surahmemorization-level-${level.toLowerCase()}`;
}

function updateSelectedCount() {
  const selectedCount = surahs.filter(surah => surah.isSelected).length;
  selectedCountSpan.textContent = `${selectedCount} surahs selected`;
  startRevisionBtn.disabled = selectedCount === 0;
}

searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filteredSurahs = surahs.filter(surah =>
    surah.name.toLowerCase().includes(searchTerm) ||
    surah.number.toString().includes(searchTerm)
  );
  renderFilteredSurahList(filteredSurahs);
});

function renderFilteredSurahList(filteredSurahs) {
  surahList.innerHTML = '';
  filteredSurahs.forEach(surah => {
    const surahItem = document.createElement('div');
    surahItem.className = 'surahmemorization-item';
    surahItem.innerHTML = `
      <input type="checkbox" id="surah-${surah.number}" ${surah.isSelected ? 'checked' : ''}>
      <label for="surah-${surah.number}">
        <span class="surahmemorization-name">${surah.name}</span>
        <span class="surahmemorization-number">(${surah.number})</span>
      </label>
      <span class="surahmemorization-level ${getLevelClass(surah.memorizationLevel)}">${surah.memorizationLevel || 'N/A'}</span>
      <span class="surahmemorization-last-revision">Last revised: ${surah.lastRevisionDate || 'N/A'}</span>
    `;
    surahList.appendChild(surahItem);

    surahItem.querySelector('input').addEventListener('change', (e) => {
      surah.isSelected = e.target.checked;
      updateSelectedCount();
    });
  });
}

filterSelect.addEventListener('change', (e) => {
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
    default:
      // No filter
      break;
  }
  renderFilteredSurahList(filteredSurahs);
});

toggleAllBtn.addEventListener('click', () => {
  const allSelected = surahs.every(surah => surah.isSelected);
  surahs.forEach(surah => surah.isSelected = !allSelected);
  renderSurahList();
  updateSelectedCount();
});

startRevisionBtn.addEventListener('click', () => {
  const selectedSurahs = surahs.filter(surah => surah.isSelected);
  if (selectedSurahs.length > 0) {
    currentSurahIndex = 0;
    surahs = selectedSurahs;
    document.getElementById('surahmemorization-revise').style.display = 'block';
    document.getElementById('surahmemorization-select').style.display = 'none';
    renderCurrentSurah();
  }
});

// Revise Surah Section
function renderCurrentSurah() {
  const currentSurah = surahs[currentSurahIndex];
  currentSurahTitle.textContent = currentSurah.name;
  surahProgress.textContent = `Surah ${currentSurahIndex + 1} of ${surahs.length}`;
  surahText.textContent = currentSurah.text;
  surahText.style.display = 'none';
  toggleTextBtn.innerHTML = '<span class="icon">👁</span> Show Text';

  // Update progress bar
  const progressPercentage = ((currentSurahIndex + 1) / surahs.length) * 100;
  progressBarFill.style.width = `${progressPercentage}%`;

  prevSurahBtn.disabled = currentSurahIndex === 0;
  nextSurahBtn.disabled = currentSurahIndex === surahs.length - 1;
  skipBtn.disabled = currentSurahIndex === surahs.length - 1;
}

toggleTextBtn.addEventListener('click', () => {
  if (surahText.style.display === 'none') {
    surahText.style.display = 'block';
    toggleTextBtn.innerHTML = '<span class="icon">👁</span> Hide Text';
  } else {
    surahText.style.display = 'none';
    toggleTextBtn.innerHTML = '<span class="icon">👁</span> Show Text';
  }
});

skipBtn.addEventListener('click', () => {
  if (currentSurahIndex < surahs.length - 1) {
    currentSurahIndex++;
    renderCurrentSurah();
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

    // Envoyer la mise à jour au backend
    try {
      await apiRequest(`/surah-memorization/surahs/${currentSurah.number}`, 'POST', {
        memorizationLevel: level,
        lastRevisionDate: currentSurah.lastRevisionDate
      });
    } catch (error) {
      console.error('Error updating surah:', error);
    }

    if (currentSurahIndex < surahs.length - 1) {
      currentSurahIndex++;
      renderCurrentSurah();
    } else {
      alert('Revision completed!');
      document.getElementById('surahmemorization-revise').style.display = 'none';
      document.getElementById('surahmemorization-history').style.display = 'block';
      renderHistoryCharts();
      renderHistoryTable();
    }
  });
});

prevSurahBtn.addEventListener('click', () => {
  if (currentSurahIndex > 0) {
    currentSurahIndex--;
    renderCurrentSurah();
  }
});

nextSurahBtn.addEventListener('click', () => {
  if (currentSurahIndex < surahs.length - 1) {
    currentSurahIndex++;
    renderCurrentSurah();
  }
});

// History Section
async function renderHistoryCharts() {
  const ctx1 = document.getElementById('surahmemorization-progress-chart').getContext('2d');
  const ctx2 = document.getElementById('surahmemorization-performance-chart').getContext('2d');

  try {
    const data = await apiRequest('/surah-memorization/history');
    const historyData = data.history;

    // Préparer les données pour les graphiques
    // ... (Vous devrez adapter en fonction de la structure des données renvoyées)

    // Exemple de création de graphiques avec Chart.js
    // Progress Chart
    new Chart(ctx1, {
      type: 'bar',
      data: {
        // Vos données ici
      },
      options: {
        // Vos options ici
      }
    });

    // Performance Chart
    new Chart(ctx2, {
      type: 'pie',
      data: {
        // Vos données ici
      },
      options: {
        // Vos options ici
      }
    });

  } catch (error) {
    console.error('Error loading history:', error);
  }
}

async function renderHistoryTable() {
  historyTable.innerHTML = '';
  try {
    const data = await apiRequest('/surah-memorization/history');
    const historyData = data.history;

    historyData.forEach(entry => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${entry.name}</td>
        <td>${entry.number}</td>
        <td>${entry.lastRevisionDate}</td>
        <td class="${getLevelClass(entry.memorizationLevel)}">${entry.memorizationLevel || 'N/A'}</td>
        <td>${entry.nextRevisionDate || 'N/A'}</td>
      `;
      historyTable.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading history:', error);
  }
}

historyFilter.addEventListener('change', (e) => {
  const filter = e.target.value.toLowerCase();
  const rows = historyTable.querySelectorAll('tr');
  rows.forEach(row => {
    const level = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
    row.style.display = (filter === 'all' || level === filter) ? '' : 'none';
  });
});

exportBtn.addEventListener('click', async () => {
  try {
    const data = await apiRequest('/surah-memorization/history');
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
  } catch (error) {
    console.error('Error exporting data:', error);
  }
});

clearHistoryBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear all revision history? This action cannot be undone.')) {
    try {
      await apiRequest('/surah-memorization/history', 'DELETE');
      revisionHistory = [];
      renderHistoryTable();
      renderHistoryCharts();
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }
});

// Function to initialize the Surah Memorization feature
function initSurahMemorization() {
  document.getElementById('surahmemorization-select').style.display = 'block';
  document.getElementById('surahmemorization-revise').style.display = 'none';
  document.getElementById('surahmemorization-history').style.display = 'none';
  loadSurahs();
}

// Call the initialization function when the page loads
document.addEventListener('DOMContentLoaded', initSurahMemorization);
