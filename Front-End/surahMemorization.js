// surahMemorization.js

let surahs = [];
let currentSurahIndex = 0;
let revisionHistory = [];

// Carte de Couleurs pour les Niveaux d'Évaluation
const levelColors = {
  'Strong': 'rgb(34, 197, 94)',    // Vert
  'Good': 'rgb(59, 130, 246)',      // Bleu
  'Moderate': 'rgb(234, 179, 8)',  // Jaune
  'Weak': 'rgb(239, 68, 68)'        // Rouge
};

// Variables pour stocker les instances de Chart.js
let progressChart = null;
let performanceChart = null;

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
const progressBarFill = document.querySelector('.surahmemorization-progress-bar-fill');
const historyFilter = document.getElementById('surahmemorization-history-filter');
const historyTable = document.getElementById('surahmemorization-history-table').querySelector('tbody');
const exportBtn = document.getElementById('surahmemorization-export');
const clearHistoryBtn = document.getElementById('surahmemorization-clear');

// Base URL de votre API backend
const API_BASE_URL = `/api`; // Remplacez par l'URL appropriée

// Récupérer le token d'authentification depuis le stockage local
const token = localStorage.getItem('token');

// Fonction pour faire des requêtes API avec le token
async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Token absent, redirection vers la page de connexion.');
    window.location.href = '/login'; // Rediriger vers la page de connexion
    return;
  }

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

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error during API request:', error);
    if (error.message.includes('403')) {
      alert('Accès refusé. Veuillez vérifier vos permissions.');
      // Optionnel: Rediriger ou déconnecter l'utilisateur
    } else if (error.message.includes('401')) {
      alert('Non autorisé. Veuillez vous reconnecter.');
      window.location.href = '/login'; // Rediriger vers la page de connexion
    } else {
      alert('Une erreur s\'est produite lors de la requête.');
    }
    throw error;
  }
}


// Fonction de mélange aléatoire (Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Navigation
navButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetSection = button.dataset.target; // Récupérer la section cible depuis l'attribut data-target
    sections.forEach(section => {
      section.style.display = section.id === `surahmemorization-${targetSection}` ? 'block' : 'none';
    });
    if (targetSection === 'history') {
      renderHistoryCharts();
      renderHistoryTable();
    }
  });
});

// Charger les sourates depuis l'API
async function loadSurahs() {
  try {
    const data = await apiRequest('/surah-memorization/surahs');
    surahs = data.surahs.map(surah => ({
      number: surah.number,
      name: surah.name,
      arabic: surah.arabic,
      memorizationLevel: surah.memorizationLevel || null,
      lastRevisionDate: surah.lastRevisionDate || null,
      isSelected: surah.isKnown // Utiliser le champ isKnown du backend
    }));

    renderSurahList();
    updateSelectedCount();
  } catch (error) {
    console.error('Error loading surahs:', error);
    alert('Une erreur s\'est produite lors du chargement des sourates.');
  }
}

// Bouton Enregistrer
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

// Section Sélection des Sourates
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

    const checkbox = surahItem.querySelector('input');

    checkbox.addEventListener('change', async (e) => {
      surah.isSelected = e.target.checked;
      updateSelectedCount();

      // Mettre à jour le statut dans le backend
      try {
        await apiRequest(`/surah-memorization/surahs/${surah.number}`, 'PUT', {
          isKnown: surah.isSelected
        });
        console.log(`Surah ${surah.number} updated to ${surah.isSelected ? 'known' : 'unknown'}.`);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la sourate ${surah.number}:`, error);
        alert(`Une erreur s'est produite lors de la mise à jour de la sourate ${surah.number}.`);
        // Revenir à l'état précédent en cas d'erreur
        surah.isSelected = !surah.isSelected;
        checkbox.checked = surah.isSelected;
        updateSelectedCount();
      }
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

// Recherche des Sourates
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

    const checkbox = surahItem.querySelector('input');

    checkbox.addEventListener('change', async (e) => {
      surah.isSelected = e.target.checked;
      updateSelectedCount();

      // Mettre à jour le statut dans le backend
      try {
        await apiRequest(`/surah-memorization/surahs/${surah.number}`, 'PUT', {
          isKnown: surah.isSelected
        });
        console.log(`Surah ${surah.number} updated to ${surah.isSelected ? 'known' : 'unknown'}.`);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la sourate ${surah.number}:`, error);
        alert(`Une erreur s'est produite lors de la mise à jour de la sourate ${surah.number}.`);
        // Revenir à l'état précédent en cas d'erreur
        surah.isSelected = !surah.isSelected;
        checkbox.checked = surah.isSelected;
        updateSelectedCount();
      }
    });
  });
}

// Filtrer les Sourates
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

// Bouton Select All
toggleAllBtn.addEventListener('click', async () => {
  const allSelected = surahs.every(surah => surah.isSelected);
  surahs.forEach(async surah => {
    surah.isSelected = !allSelected;
    // Mettre à jour le statut dans le backend
    try {
      await apiRequest(`/surah-memorization/surahs/${surah.number}`, 'PUT', {
        isKnown: surah.isSelected
      });
      console.log(`Surah ${surah.number} updated to ${surah.isSelected ? 'known' : 'unknown'}.`);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la sourate ${surah.number}:`, error);
      alert(`Une erreur s'est produite lors de la mise à jour de la sourate ${surah.number}.`);
      // Revenir à l'état précédent en cas d'erreur
      surah.isSelected = !surah.isSelected;
    }
  });
  renderSurahList();
  updateSelectedCount();
});

// Bouton Start Revision
startRevisionBtn.addEventListener('click', () => {
  const selectedSurahs = surahs.filter(surah => surah.isSelected);

  if (selectedSurahs.length === 0) {
    alert('Veuillez sélectionner au moins une sourate à réviser.');
    return;
  }

  // Mélanger les sourates sélectionnées
  const shuffledSurahs = shuffleArray(selectedSurahs.slice());

  // Mettre à jour les sourates à réviser
  currentSurahIndex = 0;
  surahs = shuffledSurahs;

  // Afficher la section de révision et masquer la section de sélection
  document.getElementById('surahmemorization-revise').style.display = 'block';
  document.getElementById('surahmemorization-select').style.display = 'none';

  // Afficher la première sourate révisée
  renderCurrentSurah();
});

// Section de Révision des Sourates
function renderCurrentSurah() {
  const currentSurah = surahs[currentSurahIndex];
  currentSurahTitle.textContent = currentSurah.name;
  surahProgress.textContent = `Sourate ${currentSurahIndex + 1} sur ${surahs.length}`;
  surahText.textContent = currentSurah.text;
  surahText.style.display = 'none';
  toggleTextBtn.innerHTML = '<span class="icon">👁</span> Show Text';

  // Mettre à jour la barre de progression
  const progressPercentage = ((currentSurahIndex + 1) / surahs.length) * 100;
  progressBarFill.style.width = `${progressPercentage}%`;
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

// Boutons d'Évaluation
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
      console.log(`Surah ${currentSurah.number} evaluated as ${level}.`);
    } catch (error) {
      console.error('Error updating surah:', error);
      alert('Une erreur s\'est produite lors de la mise à jour de la sourate.');
    }

    // Passer à la sourate suivante après l'évaluation
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

// Section Historique
async function renderHistoryCharts() {
  const ctx1 = document.getElementById('surahmemorization-progress-chart').getContext('2d');
  const ctx2 = document.getElementById('surahmemorization-performance-chart').getContext('2d');

  try {
    const data = await apiRequest('/surah-memorization/history');
    const historyData = data.history;

    if (!historyData || historyData.length === 0) {
      console.warn('Aucune donnée d\'historique disponible.');
      // Vous pouvez afficher un message ou masquer les graphiques ici
      return;
    }

    // Détruire les graphiques existants si ils existent
    if (progressChart) {
      progressChart.destroy();
    }
    if (performanceChart) {
      performanceChart.destroy();
    }

    // Préparer les données pour les graphiques

    // Progress Chart
    progressChart = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: historyData.map(entry => entry.name),
        datasets: [{
          label: 'Date de la Dernière Révision',
          data: historyData.map(entry => new Date(entry.lastRevisionDate).getTime()),
          backgroundColor: historyData.map(entry => levelColors[entry.memorizationLevel] || 'rgba(201, 203, 207, 0.6)'), // Couleurs correspondantes
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

    // Performance Chart
    const levelCounts = historyData.reduce((acc, entry) => {
      const level = entry.memorizationLevel || 'N/A';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    // Filtrer les niveaux connus (Strong, Good, Moderate, Weak)
    const filteredLevels = ['Strong', 'Good', 'Moderate', 'Weak'];
    const filteredLevelCounts = {};
    filteredLevels.forEach(level => {
      if (levelCounts[level]) {
        filteredLevelCounts[level] = levelCounts[level];
      }
    });

    performanceChart = new Chart(ctx2, {
      type: 'pie',
      data: {
        labels: Object.keys(filteredLevelCounts),
        datasets: [{
          data: Object.values(filteredLevelCounts),
          backgroundColor: Object.keys(filteredLevelCounts).map(level => levelColors[level]),
          borderColor: Object.keys(filteredLevelCounts).map(level => 'rgba(255, 255, 255, 1)'),
          borderWidth: 2
        }]
      },
      options: {
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Niveaux de Mémorisation' }
        }
      }
    });

  } catch (error) {
    console.error('Error loading history:', error);
    alert('Une erreur s\'est produite lors du chargement de l\'historique.');
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
    alert('Une erreur s\'est produite lors du chargement du tableau d\'historique.');
  }
}

// Filtrer l'Historique
historyFilter.addEventListener('change', (e) => {
  const filter = e.target.value.toLowerCase();
  const rows = historyTable.querySelectorAll('tr');
  rows.forEach(row => {
    const level = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
    row.style.display = (filter === 'all' || level === filter) ? '' : 'none';
  });
});

// Exporter l'Historique
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
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Une erreur s\'est produite lors de l\'exportation des données.');
  }
});

// Effacer l'Historique
clearHistoryBtn.addEventListener('click', async () => {
  if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique de révision ? Cette action est irréversible.')) {
    try {
      await apiRequest('/surah-memorization/history', 'DELETE');
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

// Initialiser la Fonctionnalité de Mémorisation des Sourates
function initSurahMemorization() {
  document.getElementById('surahmemorization-select').style.display = 'block';
  document.getElementById('surahmemorization-revise').style.display = 'none';
  document.getElementById('surahmemorization-history').style.display = 'none';
  loadSurahs();
}

export { initSurahMemorization };