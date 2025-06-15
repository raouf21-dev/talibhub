// surahMemorization.js

import { api } from "../../services/api/dynamicLoader.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import { translationManager } from "../../translations/TranslationManager.js";

// Flag de protection contre les initialisations multiples
let isInitialized = false;
let isLoading = false;

// Variables globales
let allSurahs = [];
let surahsInRevision = [];
let currentSurahIndex = 0;
let revisionHistory = [];
let progressChart = null;
let performanceChart = null;

// ========== CACHE MANAGEMENT ==========
let dataCache = {
  surahs: null,
  timestamp: null,
  history: null,
  historyTimestamp: null,
  arabicTexts: {}, // Cache pour les textes arabes
  audioCache: {}, // Cache pour les URLs et objets audio
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Constantes
const levelColors = {
  Strong: "rgb(34, 197, 94)", // Vert
  Good: "rgb(59, 130, 246)", // Bleu
  Moderate: "rgb(234, 179, 8)", // Jaune
  Weak: "rgb(239, 68, 68)", // Rouge
};

// Références DOM (initialisées de manière sécurisée)
let domRefs = {};

// Variables globales pour la gestion audio
let currentAudio = null;
let currentPlayingVerse = null;
const DEFAULT_RECITER = "ar.alafasy"; // Récitateur par défaut
const AUDIO_BITRATE = "64"; // Qualité audio (64kbps pour performance)

function initializeDOMReferences() {
  domRefs = {
    navButtons: document.querySelectorAll(".quran-app-nav-button"),
    sections: document.querySelectorAll(".quran-app-section"),
    surahList: document.getElementById("surahmemorization-list"),
    searchInput: document.getElementById("surahmemorization-search"),
    filterSelect: document.getElementById("surahmemorization-filter"),
    selectedCountSpan: document.getElementById("surahmemorization-count"),
    startRevisionBtn: document.getElementById("surahmemorization-start"),
    currentSurahTitle: document.getElementById(
      "surahmemorization-current-title"
    ),
    surahProgress: document.getElementById("surahmemorization-progress"),
    surahText: document.getElementById("surahmemorization-text"),
    toggleTextBtn: document.getElementById("surahmemorization-toggle-text"),
    evaluationButtons: document.querySelectorAll(".surahmemorization-eval-btn"),
    historyFilter: document.getElementById("surahmemorization-history-filter"),
    historyTable: document
      .getElementById("surahmemorization-history-table")
      ?.querySelector("tbody"),
    exportBtn: document.getElementById("surahmemorization-export"),
    clearHistoryBtn: document.getElementById("surahmemorization-clear"),
  };
}

/* ------------------ Fonctions utilitaires ------------------ */

// Fonction pour calculer le numéro global d'un verset
function getGlobalAyahNumber(surahNumber, verseNumber) {
  // Table des débuts de sourates (cumul des versets précédents)
  const surahStarts = [
    0, 7, 293, 493, 669, 789, 954, 1160, 1235, 1364, 1473, 1596, 1707, 1750,
    1802, 1901, 2029, 2140, 2250, 2348, 2483, 2595, 2673, 2791, 2855, 2932,
    3159, 3252, 3340, 3409, 3469, 3503, 3533, 3606, 3660, 3705, 3788, 3970,
    4058, 4133, 4272, 4325, 4414, 4473, 4510, 4545, 4583, 4612, 4630, 4675,
    4735, 4784, 4846, 4901, 4919, 4983, 5075, 5104, 5126, 5150, 5163, 5177,
    5188, 5199, 5217, 5229, 5241, 5271, 5323, 5375, 5419, 5447, 5475, 5495,
    5551, 5591, 5622, 5672, 5712, 5758, 5800, 5829, 5848, 5884, 5909, 5931,
    5948, 5967, 5993, 6023, 6043, 6058, 6079, 6090, 6098, 6106, 6125, 6130,
    6138, 6146, 6157, 6168, 6176, 6179, 6188, 6193, 6197, 6204, 6207, 6213,
    6216, 6221, 6225, 6230, 6236,
  ];

  if (surahNumber < 1 || surahNumber > 114) return null;

  return surahStarts[surahNumber - 1] + parseInt(verseNumber);
}

/* ------------------ Fonctions de gestion audio ------------------ */

// Arrêter l'audio en cours et réinitialiser l'interface
function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (currentPlayingVerse) {
    // Réinitialiser l'apparence du verset précédent
    const previousVerse = document.querySelector(
      `[data-verse-number="${currentPlayingVerse}"]`
    );
    if (previousVerse) {
      previousVerse.classList.remove("verse-playing");
      const previousBtn = previousVerse.querySelector(".verse-audio-btn");
      if (previousBtn) {
        previousBtn.innerHTML = '<span class="audio-icon">🔊</span>';
        previousBtn.classList.remove("playing");
        previousBtn.disabled = false;
      }
    }
    currentPlayingVerse = null;
  }
}

// Fonction principale pour jouer un verset
async function playVerseAudio(surahNumber, verseNumber, button) {
  try {
    // Arrêter l'audio précédent
    stopCurrentAudio();

    // Calculer le numéro global du verset
    const globalAyahNumber = getGlobalAyahNumber(surahNumber, verseNumber);
    if (!globalAyahNumber) {
      throw new Error("Numéro de verset invalide");
    }

    // Clé de cache
    const cacheKey = `${globalAyahNumber}_${DEFAULT_RECITER}`;

    // Vérifier le cache audio
    let audioUrl;
    if (dataCache.audioCache[cacheKey]) {
      audioUrl = dataCache.audioCache[cacheKey];
      console.log(
        `🎵 Utilisation du cache audio pour le verset ${globalAyahNumber}`
      );
    } else {
      // Construire l'URL du CDN
      audioUrl = `https://cdn.islamic.network/quran/audio/${AUDIO_BITRATE}/${DEFAULT_RECITER}/${globalAyahNumber}.mp3`;

      // Mettre en cache
      dataCache.audioCache[cacheKey] = audioUrl;
      console.log(`🎵 Chargement audio pour le verset ${globalAyahNumber}`);
    }

    // Mettre à jour l'interface pendant le chargement
    button.innerHTML = '<span class="audio-icon">⏳</span>';
    button.disabled = true;
    button.classList.add("loading");

    // Créer et configurer l'objet Audio
    currentAudio = new Audio(audioUrl);
    currentPlayingVerse = verseNumber;

    // Gestionnaires d'événements audio
    currentAudio.addEventListener("loadstart", () => {
      console.log(`🎵 Début du chargement audio pour le verset ${verseNumber}`);
    });

    currentAudio.addEventListener("canplay", () => {
      console.log(`🎵 Audio prêt pour le verset ${verseNumber}`);
      // Mettre à jour l'interface une fois que l'audio est prêt
      button.innerHTML = '<span class="audio-icon">⏸️</span>';
      button.classList.remove("loading");
      button.classList.add("playing");
      button.disabled = false;

      // Mettre en évidence le verset en cours
      const verseElement = document.querySelector(
        `[data-verse-number="${verseNumber}"]`
      );
      if (verseElement) {
        verseElement.classList.add("verse-playing");
      }
    });

    currentAudio.addEventListener("ended", () => {
      console.log(`🎵 Lecture terminée pour le verset ${verseNumber}`);
      stopCurrentAudio();
    });

    currentAudio.addEventListener("error", (e) => {
      console.error(`❌ Erreur audio pour le verset ${verseNumber}:`, e);

      // Nettoyer l'interface en cas d'erreur
      button.innerHTML = '<span class="audio-icon">❌</span>';
      button.classList.remove("loading", "playing");
      button.disabled = false;

      // Notification d'erreur
      const errorMessage = translationManager.tn(
        "surah.audioError",
        {},
        "Erreur lors du chargement de l'audio"
      );
      notificationService.show(errorMessage, "error", 3000);

      // Retirer du cache si erreur
      delete dataCache.audioCache[cacheKey];

      // Réinitialiser les variables
      currentAudio = null;
      currentPlayingVerse = null;
    });

    // Lancer la lecture
    await currentAudio.play();
  } catch (error) {
    console.error(
      `❌ Erreur lors de la lecture du verset ${verseNumber}:`,
      error
    );

    // Nettoyer l'interface
    button.innerHTML = '<span class="audio-icon">🔊</span>';
    button.classList.remove("loading", "playing");
    button.disabled = false;

    // Notification d'erreur
    const errorMessage = translationManager.tn(
      "surah.audioError",
      {},
      "Impossible de lire l'audio"
    );
    notificationService.show(errorMessage, "error", 3000);
  }
}

// Gestionnaire de clic pour les boutons audio
function handleVerseAudioClick(event) {
  const button = event.target.closest(".verse-audio-btn");
  if (!button) return;

  const surahNumber = parseInt(button.dataset.surah);
  const verseNumber = parseInt(button.dataset.verse);

  // Si c'est le verset en cours de lecture, l'arrêter
  if (
    currentPlayingVerse === verseNumber &&
    currentAudio &&
    !currentAudio.paused
  ) {
    stopCurrentAudio();
    return;
  }

  // Sinon, jouer le nouveau verset
  playVerseAudio(surahNumber, verseNumber, button);
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getLevelClass(level) {
  if (!level) return "surahmemorization-level-na";
  return `surahmemorization-level-${level.toLowerCase()}`;
}

function isDueForRevision(surah) {
  if (!surah.nextRevisionDate) return false;
  const today = new Date();
  const dueDate = new Date(surah.nextRevisionDate);
  return dueDate <= today;
}

/* ------------------ Création des boutons de sélection rapide ------------------ */
function createQuickSelectionButtons() {
  let container = document.getElementById("surahmemorization-quick-selection");
  if (!container) {
    container = document.createElement("div");
    container.id = "surahmemorization-quick-selection";
    container.className = "surahmemorization-quick-selection";

    const selectSection = document.querySelector("#surahmemorization-select");
    const listContainer = document.getElementById(
      "surahmemorization-list-container"
    );
    if (selectSection && listContainer) {
      selectSection.insertBefore(container, listContainer);
    }
  }

  // Obtenir les textes traduits
  const dueSurahsText = translationManager.tn(
    "surah.quick.toReview",
    {},
    "À réviser : {count}"
  );
  const selectAllText = translationManager.tn(
    "surah.quick.selectAll",
    {},
    "Tout sélectionner"
  );
  const clearAllText = translationManager.tn(
    "surah.quick.clearAll",
    {},
    "Tout désélectionner"
  );

  container.innerHTML = `
    <div class="quick-selection-header">
      <h4>Sélection rapide</h4>
    </div>
    <div class="quick-selection-buttons">
      <button id="select-due-surahs" class="quick-btn due-btn" title="Sélectionner les sourates en retard">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
        <span class="text" id="due-text">${translationManager.tn(
          "surah.quick.toReview",
          { count: 0 },
          "À réviser : 0"
        )}</span>
      </button>
      <button id="select-by-level" class="quick-btn level-btn" title="Sélectionner par niveau">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <rect x="7" y="7" width="10" height="10" rx="1" ry="1"/>
        </svg>
        <select id="level-selector" title="Choisir le niveau">
          <option value="">Niveau</option>
          <option value="Weak">Weak</option>
          <option value="Moderate">Moderate</option>
          <option value="Good">Good</option>
          <option value="Strong">Strong</option>
        </select>
      </button>
      <button id="select-all-surahs" class="quick-btn all-btn" title="${selectAllText}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
        <span class="text">${selectAllText}</span>
      </button>
      <button id="clear-all-surahs" class="quick-btn clear-btn" title="${clearAllText}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <path d="m15 9-6 6"/>
          <path d="m9 9 6 6"/>
        </svg>
        <span class="text">${clearAllText}</span>
      </button>
    </div>
  `;

  // Attacher les événements une seule fois
  attachQuickSelectionEvents();
}

function attachQuickSelectionEvents() {
  // Nettoyer les anciens événements d'abord
  document
    .getElementById("select-due-surahs")
    ?.removeEventListener("click", selectDueSurahs);
  document
    .getElementById("select-by-level")
    ?.removeEventListener("click", selectByLevel);
  document
    .getElementById("select-all-surahs")
    ?.removeEventListener("click", selectAllSurahs);
  document
    .getElementById("clear-all-surahs")
    ?.removeEventListener("click", clearAllSurahs);

  // Attacher les nouveaux événements
  document
    .getElementById("select-due-surahs")
    ?.addEventListener("click", selectDueSurahs);
  document
    .getElementById("select-by-level")
    ?.addEventListener("click", selectByLevel);
  document
    .getElementById("select-all-surahs")
    ?.addEventListener("click", selectAllSurahs);
  document
    .getElementById("clear-all-surahs")
    ?.addEventListener("click", clearAllSurahs);

  // Gérer le clic sur le select pour empêcher la propagation
  document
    .getElementById("level-selector")
    ?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
}

// Fonctions d'événements séparées pour éviter les fuites mémoire
function selectDueSurahs() {
  selectSurahsBy((surah) => surah.isDue);
  notificationService.show("surah.overdue.selected", "success");
}

function selectByLevel() {
  const level = document.getElementById("level-selector").value;
  if (level) {
    selectSurahsBy((surah) => surah.memorizationLevel === level);
    notificationService.show("surah.level.selected", "success", 3000, {
      level,
    });
  }
}

function selectAllSurahs() {
  selectSurahsBy(() => true);
  notificationService.show("surah.all.selected", "success");
}

function clearAllSurahs() {
  selectSurahsBy(() => false);
  notificationService.show("surah.selection.cleared", "info");
}

function selectSurahsBy(filterFn) {
  const checkboxes = document.querySelectorAll(
    '#surahmemorization-list input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    const surahNumber = parseInt(checkbox.value);
    const surah = allSurahs.find((s) => s.number === surahNumber);
    if (surah) {
      checkbox.checked = filterFn(surah);
      surah.isSelected = checkbox.checked;
    }
  });
  updateSelectedCount();
}

function updateDueSurahCount() {
  const dueSurahs = allSurahs.filter((surah) => surah.isDue);
  const textElement = document.getElementById("due-text");
  if (textElement) {
    const dueSurahsText = translationManager.tn(
      "surah.quick.toReview",
      {
        count: dueSurahs.length,
      },
      `À réviser : ${dueSurahs.length}`
    );

    textElement.textContent = dueSurahsText;
  }
}

/* ------------------ Mise à jour des textes des boutons de sélection rapide ------------------ */
function updateQuickSelectionButtonTexts() {
  // Mettre à jour le texte du bouton "À réviser"
  updateDueSurahCount();

  // Mettre à jour le texte du bouton "Tout sélectionner"
  const selectAllButton = document.getElementById("select-all-surahs");
  if (selectAllButton) {
    const selectAllText = translationManager.tn(
      "surah.quick.selectAll",
      {},
      "Tout sélectionner"
    );

    const textSpan = selectAllButton.querySelector(".text");
    if (textSpan) {
      textSpan.textContent = selectAllText;
    }
    selectAllButton.setAttribute("title", selectAllText);
  }

  // Mettre à jour le texte du bouton "Tout désélectionner"
  const clearAllButton = document.getElementById("clear-all-surahs");
  if (clearAllButton) {
    const clearAllText = translationManager.tn(
      "surah.quick.clearAll",
      {},
      "Tout désélectionner"
    );

    const textSpan = clearAllButton.querySelector(".text");
    if (textSpan) {
      textSpan.textContent = clearAllText;
    }
    clearAllButton.setAttribute("title", clearAllText);
  }
}

/* ------------------ Fonction utilitaire pour créer un élément sourate ------------------ */
function createSurahElement(surah) {
  const surahItem = document.createElement("div");
  surahItem.className = `surahmemorization-item ${
    surah.isDue ? "due-for-revision" : ""
  }`;

  const nextRevisionText = surah.nextRevisionDate
    ? surah.isDue
      ? `EN RETARD - ${formatDate(surah.nextRevisionDate)}`
      : formatDate(surah.nextRevisionDate)
    : translationManager.t("content.surah.neverRevised", "Jamais révisée");

  surahItem.innerHTML = `
    <div class="item-left">
      <input type="checkbox" id="surah-${surah.number}" value="${
    surah.number
  }" ${surah.isSelected ? "checked" : ""}>
      <label for="surah-${surah.number}">
        <span class="surah-name">${surah.name}</span>
        <span class="surah-number">(${surah.number})</span>
                  ${surah.isDue ? '<span class="due-indicator">!</span>' : ""}
      </label>
    </div>
    <div class="item-center">
      <span class="memorization-level ${getLevelClass(
        surah.memorizationLevel
      )}">
        ${
          surah.memorizationLevel
            ? translationManager.t(
                `content.surah.levels.${surah.memorizationLevel}`,
                surah.memorizationLevel
              )
            : "N/A"
        }
      </span>
    </div>
    <div class="item-right">
      ${nextRevisionText}
    </div>
  `;

  const checkbox = surahItem.querySelector("input");
  checkbox.addEventListener("change", (e) => {
    surah.isSelected = e.target.checked;
    updateSelectedCount();
  });

  return surahItem;
}

/* ------------------ Rendu de la liste des sourates ------------------ */
function renderSurahList() {
  if (!domRefs.surahList) return;

  let container = document.getElementById("surahmemorization-list-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "surahmemorization-list-container";
    document.querySelector("#surahmemorization-select")?.appendChild(container);

    container.innerHTML = `
      <div class="surahmemorization-headers">
        <div class="header-left">
          <span>Sourates</span>
        </div>
        <div class="header-center">
          <span>Niveau</span>
        </div>
        <div class="header-right">
          <span>Prochaine révision</span>
        </div>
      </div>
      <div id="surahmemorization-list"></div>
    `;
  }

  // Créer les boutons de sélection rapide
  createQuickSelectionButtons();

  domRefs.surahList.innerHTML = "";
  let dueCount = 0;

  allSurahs.forEach((surah) => {
    if (surah.isDue) dueCount++;
    const surahElement = createSurahElement(surah);
    domRefs.surahList.appendChild(surahElement);
  });

  // Mettre à jour le compteur de sourates en retard
  updateDueSurahCount();

  // Mettre à jour le compteur de sélection
  updateSelectedCount();
}

/* ------------------ Mise à jour du compteur de sourates sélectionnées ------------------ */
function updateSelectedCount() {
  if (!domRefs.selectedCountSpan) return;

  const selectedCount = allSurahs.filter((surah) => surah.isSelected).length;
  const translatedText = translationManager
    .t("content.surah.selected", `${selectedCount} sourates sélectionnées`)
    .replace("{count}", selectedCount);
  domRefs.selectedCountSpan.textContent = translatedText;

  if (domRefs.startRevisionBtn) {
    domRefs.startRevisionBtn.disabled = selectedCount === 0;
  }
}

/* ------------------ Rendu de la liste filtrée ------------------ */
function renderFilteredSurahList(filteredSurahs) {
  if (!domRefs.surahList) return;
  domRefs.surahList.innerHTML = "";

  filteredSurahs.forEach((surah) => {
    const surahElement = createSurahElement(surah);
    domRefs.surahList.appendChild(surahElement);
  });

  // Mettre à jour le compteur de sélection après filtrage
  updateSelectedCount();
}

/* ------------------ Rendu de la sourate en cours ------------------ */
function renderCurrentSurah() {
  const currentSurah = surahsInRevision[currentSurahIndex];
  if (!currentSurah || !domRefs.currentSurahTitle) return;

  // Arrêter l'audio en cours lors du changement de sourate
  stopCurrentAudio();

  domRefs.currentSurahTitle.textContent = currentSurah.name;
  if (domRefs.surahText) {
    domRefs.surahText.innerHTML = "";
    domRefs.surahText.style.display = "none";
  }
  if (domRefs.toggleTextBtn) {
    domRefs.toggleTextBtn.innerHTML = '<span class="icon">👁</span> Show Text';
  }

  if (domRefs.surahProgress) {
    domRefs.surahProgress.textContent = `Sourate ${currentSurahIndex + 1} sur ${
      surahsInRevision.length
    }`;
  }

  if (domRefs.progressBarFill) {
    const progressPercentage =
      ((currentSurahIndex + 1) / surahsInRevision.length) * 100;
    domRefs.progressBarFill.style.width = `${progressPercentage}%`;
  }
}

/* ------------------ Rendu des graphiques (historique/performance) avec cache ------------------ */
async function renderHistoryCharts() {
  // Chercher d'abord le container parent pour créer le canvas directement dedans
  const chartsContainer = document.querySelector(".surahmemorization-charts");
  if (!chartsContainer) return;

  // Nettoyer le contenu existant du container
  chartsContainer.innerHTML = "";

  // Créer un nouveau canvas directement dans le container parent
  const canvas = document.createElement("canvas");
  canvas.id = "surahmemorization-performance-chart";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  chartsContainer.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  try {
    if (typeof Chart === "undefined") {
      console.error("Chart.js n'est pas chargé");
      return;
    }

    // Vérifier le cache d'abord
    const now = Date.now();
    let historyData;

    if (
      dataCache.history &&
      now - dataCache.lastHistoryFetch < dataCache.CACHE_DURATION
    ) {
      console.log("📊 Utilisation du cache pour l'historique");
      historyData = dataCache.history;
    } else {
      console.log("🔄 Chargement de l'historique depuis l'API...");
      const data = await api.get("/surah-memorization/history");
      historyData = data.history;

      // Mettre à jour le cache
      dataCache.history = historyData;
      dataCache.lastHistoryFetch = now;
    }

    if (!historyData || historyData.length === 0) {
      console.warn("Aucune donnée d'historique disponible.");
      return;
    }

    if (performanceChart) performanceChart.destroy();

    const levelCounts = historyData.reduce((acc, entry) => {
      const level = entry.memorizationLevel || "N/A";
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    // Ajustement responsive des tailles de police
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;

    const titleFontSize = isMobile ? 20 : isTablet ? 24 : 28;
    const legendFontSize = isMobile ? 14 : isTablet ? 16 : 18;

    performanceChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(levelCounts),
        datasets: [
          {
            data: Object.values(levelCounts),
            backgroundColor: Object.keys(levelCounts).map(
              (level) => levelColors[level] || "#9ca3af"
            ),
            borderColor: "white",
            borderWidth: 3, // Bordure légèrement plus épaisse
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          },
        },
        elements: {
          arc: {
            borderWidth: 3,
          },
        },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 15, // Réduit pour gagner de l'espace
              font: { size: legendFontSize }, // Taille responsive
              boxWidth: 20,
              usePointStyle: true,
              pointStyle: "circle",
              generateLabels: function (chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const value = data.datasets[0].data[i];
                    const total = data.datasets[0].data.reduce(
                      (acc, val) => acc + val,
                      0
                    );
                    const percentage = ((value / total) * 100).toFixed(1);
                    return {
                      text: `${label}: ${percentage}% (${value})`,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      strokeStyle: data.datasets[0].borderColor,
                      lineWidth: data.datasets[0].borderWidth,
                      hidden: isNaN(data.datasets[0].data[i]),
                      index: i,
                    };
                  });
                }
                return [];
              },
            },
          },
          title: {
            display: true,
            text: "Répartition par niveau de mémorisation",
            padding: { top: 15, bottom: 20 }, // Réduit pour gagner de l'espace
            font: { size: titleFontSize, weight: "bold" }, // Taille responsive
          },
        },
        // Optimiser la taille du doughnut
        cutout: "40%", // Taille du trou central (40% = plus de place pour le graphique)
        radius: "90%", // Taille du graphique par rapport au container (90% = très grand)
      },
    });
  } catch (error) {
    console.error("Error loading history:", error);
    notificationService.show("surah.history.load.error", "error", 0);
  }
}

/* ------------------ Rendu du tableau de l'historique avec cache ------------------ */
async function renderHistoryTable() {
  if (!domRefs.historyTable) return;

  domRefs.historyTable.innerHTML = "";
  try {
    // Vérifier le cache d'abord
    const now = Date.now();
    let historyData;

    if (
      dataCache.history &&
      now - dataCache.lastHistoryFetch < dataCache.CACHE_DURATION
    ) {
      console.log("📋 Utilisation du cache pour le tableau d'historique");
      historyData = dataCache.history;
    } else {
      console.log("🔄 Chargement de l'historique depuis l'API...");
      const data = await api.get("/surah-memorization/history");
      historyData = data.history;

      // Mettre à jour le cache
      dataCache.history = historyData;
      dataCache.lastHistoryFetch = now;
    }

    historyData.forEach((entry) => {
      const row = document.createElement("tr");
      const translatedLevel = entry.memorizationLevel
        ? translationManager.t(
            `content.surah.levels.${entry.memorizationLevel}`,
            entry.memorizationLevel
          )
        : "N/A";

      row.innerHTML = `
        <td>${entry.name}</td>
        <td>${entry.number}</td>
        <td>${formatDate(entry.lastRevisionDate)}</td>
        <td class="${getLevelClass(
          entry.memorizationLevel
        )}">${translatedLevel}</td>
        <td>${formatDate(entry.nextRevisionDate)}</td>
      `;
      domRefs.historyTable.appendChild(row);
    });
  } catch (error) {
    console.error("❌ Error loading history:", error);
    notificationService.show("surah.history.load.error", "error", 0);
  }
}

/* ------------------ Initialisation du module de mémorisation ------------------ */
async function initSurahMemorization() {
  // Protection contre les initialisations multiples
  if (isInitialized) {
    console.log("SurahMemorization déjà initialisé, ignoré");
    return;
  }

  console.log("Initialisation de SurahMemorization...");
  isInitialized = true;

  // Initialiser les références DOM
  initializeDOMReferences();

  // Vérifier que les éléments essentiels existent
  if (!document.getElementById("surahmemorization-select")) {
    console.error("Élément surahmemorization-select non trouvé");
    isInitialized = false;
    return;
  }

  document.getElementById("surahmemorization-select").style.display = "block";
  document.getElementById("surahmemorization-history").style.display = "none";

  // Nettoyer les anciens événements avant d'attacher les nouveaux
  cleanupEventListeners();

  // Charger les données avec cache
  try {
    const data = await loadSurahDataWithCache();
    if (data && data.surahs) {
      allSurahs = data.surahs.map((surah) => ({
        ...surah,
        number: parseInt(surah.number, 10),
        isDue: surah.nextRevisionDate
          ? new Date(surah.nextRevisionDate) <= new Date()
          : false,
      }));

      updateDueSurahCount();
      renderSurahList();
      updateSelectedCount(); // Initialiser le compteur à 0 au démarrage
    }
  } catch (error) {
    console.error("Erreur lors du chargement des sourates:", error);
  }

  // Attacher les événements
  attachEventListeners();

  translationManager.onLanguageChange(() => {
    renderHistoryTable();
    updateSelectedCount();
    renderSurahList();
    updateQuickSelectionButtonTexts();
  });

  console.log("SurahMemorization initialisé avec succès");
}

/* ------------------ Nettoyage et attachement des événements ------------------ */
function cleanupEventListeners() {
  // Nettoyer les événements de navigation
  domRefs.navButtons?.forEach((button) => {
    button.removeEventListener("click", handleNavigation);
  });

  // Nettoyer les autres événements
  domRefs.searchInput?.removeEventListener("input", handleSearch);
  domRefs.filterSelect?.removeEventListener("change", handleFilter);
  domRefs.startRevisionBtn?.removeEventListener("click", handleStartRevision);
  domRefs.toggleTextBtn?.removeEventListener("click", handleToggleText);
  domRefs.evaluationButtons?.forEach((button) => {
    button.removeEventListener("click", handleEvaluation);
  });
  domRefs.historyFilter?.removeEventListener("change", handleHistoryFilter);
  domRefs.exportBtn?.removeEventListener("click", handleExport);
  domRefs.clearHistoryBtn?.removeEventListener("click", handleClearHistory);
}

function attachEventListeners() {
  // Navigation
  domRefs.navButtons?.forEach((button) => {
    button.addEventListener("click", handleNavigation);
  });

  // Recherche et filtrage
  domRefs.searchInput?.addEventListener("input", handleSearch);
  domRefs.filterSelect?.addEventListener("change", handleFilter);

  // Révision
  domRefs.startRevisionBtn?.addEventListener("click", handleStartRevision);
  domRefs.toggleTextBtn?.addEventListener("click", handleToggleText);
  domRefs.evaluationButtons?.forEach((button) => {
    button.addEventListener("click", handleEvaluation);
  });

  // Historique
  domRefs.historyFilter?.addEventListener("change", handleHistoryFilter);
  domRefs.exportBtn?.addEventListener("click", handleExport);
  domRefs.clearHistoryBtn?.addEventListener("click", handleClearHistory);
}

/* ------------------ Gestionnaires d'événements ------------------ */
function handleNavigation(event) {
  const targetSection = event.target.dataset.target;

  domRefs.sections?.forEach((section) => {
    section.style.display =
      section.id === `surahmemorization-${targetSection}` ? "block" : "none";
  });

  if (targetSection === "revise") {
    onReviseTabClicked();
  } else if (targetSection === "history") {
    renderHistoryCharts();
    renderHistoryTable();
  }
}

function onReviseTabClicked() {
  const currentLang = localStorage.getItem("userLang") || "fr";

  if (!surahsInRevision || surahsInRevision.length === 0) {
    if (currentLang === "fr") {
      domRefs.currentSurahTitle.textContent =
        'Veuillez d\'abord sélectionner des sourates dans la partie "Select Surah".';
    } else {
      domRefs.currentSurahTitle.textContent =
        "Please select surahs in the 'Select Surah' section first.";
    }

    domRefs.evaluationButtons?.forEach((btn) => (btn.disabled = true));
    if (domRefs.toggleTextBtn) domRefs.toggleTextBtn.disabled = true;
    if (domRefs.surahText) domRefs.surahText.style.display = "none";
    if (domRefs.progressBarFill) domRefs.progressBarFill.style.width = "0%";
  } else {
    domRefs.evaluationButtons?.forEach((btn) => (btn.disabled = false));
    if (domRefs.toggleTextBtn) domRefs.toggleTextBtn.disabled = false;
    renderCurrentSurah();
  }
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  const filteredSurahs = allSurahs.filter(
    (surah) =>
      surah.name.toLowerCase().includes(searchTerm) ||
      surah.number.toString().includes(searchTerm)
  );
  renderFilteredSurahList(filteredSurahs);
}

function handleFilter(e) {
  const filterValue = e.target.value;
  let filteredSurahs = [...allSurahs];

  switch (filterValue) {
    case "memorization":
      filteredSurahs.sort((a, b) => {
        const levels = { Strong: 1, Good: 2, Moderate: 3, Weak: 4, "N/A": 5 };
        return (
          levels[a.memorizationLevel || "N/A"] -
          levels[b.memorizationLevel || "N/A"]
        );
      });
      break;
    case "due":
      filteredSurahs = filteredSurahs.filter((surah) => surah.isDue);
      break;
    case "alphabetical":
      filteredSurahs.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "numerical":
      filteredSurahs.sort((a, b) => a.number - b.number);
      break;
  }
  renderFilteredSurahList(filteredSurahs);
}

async function handleStartRevision() {
  const selectedSurahs = allSurahs.filter((s) => s.isSelected);
  if (selectedSurahs.length === 0) {
    notificationService.show("surah.none.selected", "error");
    return;
  }

  // Validation supplémentaire
  const invalidSurahs = selectedSurahs.filter(
    (s) => !s.number || isNaN(parseInt(s.number))
  );
  if (invalidSurahs.length > 0) {
    console.error("Sourates avec des numéros invalides:", invalidSurahs);
    notificationService.show(
      "Erreur: numéros de sourates invalides détectés",
      "error"
    );
    return;
  }

  try {
    // Désactiver le bouton pour éviter les clics multiples
    domRefs.startRevisionBtn.disabled = true;

    const selectedNumbers = selectedSurahs.map((s) => parseInt(s.number, 10));
    console.log("Nombres sélectionnés pour révision:", selectedNumbers);
    console.log("Payload envoyé à l'API:", { sourates: selectedNumbers });

    const response = await api.post(
      "/surah-memorization/surahs/mark-for-revision",
      {
        sourates: selectedNumbers,
      }
    );

    surahsInRevision = shuffleArray(selectedSurahs);
    currentSurahIndex = 0;

    document.getElementById("surahmemorization-revise").style.display = "block";
    document.getElementById("surahmemorization-select").style.display = "none";
    document.getElementById("surahmemorization-history").style.display = "none";

    domRefs.navButtons?.forEach((btn) => {
      if (btn.dataset.target === "revise") {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    renderCurrentSurah();
    domRefs.evaluationButtons?.forEach((btn) => (btn.disabled = false));
    if (domRefs.toggleTextBtn) domRefs.toggleTextBtn.disabled = false;

    notificationService.show(
      `Session de révision démarrée avec ${selectedSurahs.length} sourates`,
      "success"
    );
  } catch (error) {
    console.error("Error starting revision:", error);
    console.error("Détails de l'erreur:", error.message);

    // Essayer de récupérer le message d'erreur exact du serveur
    let errorMessage = "Erreur lors du démarrage de la révision";
    if (error.response && error.response.data && error.response.data.error) {
      errorMessage = `Erreur serveur: ${error.response.data.error}`;
    } else if (error.message) {
      errorMessage = `Erreur: ${error.message}`;
    }

    notificationService.show(errorMessage, "error", 0);
  } finally {
    // Réactiver le bouton
    if (domRefs.startRevisionBtn) domRefs.startRevisionBtn.disabled = false;
  }
}

async function handleToggleText() {
  const currentSurah = surahsInRevision[currentSurahIndex];
  if (!currentSurah || !domRefs.surahText || !domRefs.toggleTextBtn) return;

  if (domRefs.surahText.style.display === "none") {
    // Afficher le texte
    try {
      // Vérifier si le texte est déjà chargé
      if (!domRefs.surahText.innerHTML.trim()) {
        // Changer le bouton en mode chargement avec traduction
        const loadingText = translationManager.t(
          "content.surah.loadingText",
          "Chargement..."
        );
        domRefs.toggleTextBtn.innerHTML = `<span class="icon">⏳</span> ${loadingText}`;
        domRefs.toggleTextBtn.disabled = true;

        // Charger le texte arabe
        const arabicText = await loadSurahArabicText(currentSurah.number);

        // Formater le texte pour l'affichage (numéro à gauche, texte à droite)
        const formattedHTML = arabicText
          .split("\n")
          .map((verse) => {
            // Vérifier si c'est la Basmallah (commence par "بسم الله")
            if (verse.startsWith("بسم الله")) {
              return `<div class="surah-verse basmallah-verse">
                        <span class="verse-text" style="text-align: center; font-weight: bold; margin: 10px 0; display: block;">${verse.replace(
                          "بسم الله ",
                          ""
                        )}</span>
                      </div>`;
            }

            // Séparer le numéro du texte arabe pour les versets normaux
            const spaceIndex = verse.indexOf(" ");
            if (spaceIndex > 0) {
              const verseNumber = verse.substring(0, spaceIndex);
              const verseText = verse.substring(spaceIndex + 1);
              return `<div class="surah-verse" data-verse-number="${verseNumber}">
                        <span class="verse-text">${verseText}</span>
                        <div class="verse-controls">
                          <button class="verse-audio-btn" data-verse="${verseNumber}" data-surah="${currentSurah.number}" title="Écouter ce verset">
                            <span class="audio-icon">🔊</span>
                          </button>
                          <span class="verse-number">${verseNumber}</span>
                        </div>
                      </div>`;
            }
            return `<div class="surah-verse">${verse}</div>`;
          })
          .join("");

        domRefs.surahText.innerHTML = formattedHTML;

        // Ajouter un indicateur de scroll si le contenu dépasse
        setTimeout(() => {
          if (domRefs.surahText.scrollHeight > domRefs.surahText.clientHeight) {
            const scrollText = translationManager.t(
              "content.surah.scrollIndicator",
              "⬇️ Faites défiler pour voir plus"
            );
            domRefs.surahText.setAttribute("data-scrollable", "true");
            domRefs.surahText.setAttribute("data-scroll-text", scrollText);
          }

          // Ajouter les gestionnaires d'événements pour les boutons audio
          const audioButtons =
            domRefs.surahText.querySelectorAll(".verse-audio-btn");
          audioButtons.forEach((button) => {
            button.addEventListener("click", handleVerseAudioClick);
          });
        }, 100);
      }

      domRefs.surahText.style.display = "block";
      const hideText = translationManager.t(
        "content.surah.hideText",
        "Hide Text"
      );
      domRefs.toggleTextBtn.innerHTML = `<span class="icon">👁</span> ${hideText}`;
      domRefs.toggleTextBtn.disabled = false;
    } catch (error) {
      console.error("Erreur lors du chargement du texte:", error);

      // Messages d'erreur traduits
      const errorTitle = translationManager.t(
        "content.surah.textError",
        "Connexion internet requise pour afficher le texte arabe"
      );
      const errorMessage = translationManager.t(
        "content.surah.textErrorMessage",
        "Veuillez vérifier votre connexion et réessayer"
      );

      // Afficher un message d'erreur dans le conteneur
      domRefs.surahText.innerHTML = `
        <div class="surah-error">
          <p>⚠️ ${errorTitle}</p>
          <p>${errorMessage}</p>
        </div>
      `;
      domRefs.surahText.style.display = "block";

      // Remettre le bouton en état normal
      const showText = translationManager.t(
        "content.surah.showText",
        "Show Text"
      );
      domRefs.toggleTextBtn.innerHTML = `<span class="icon">👁</span> ${showText}`;
      domRefs.toggleTextBtn.disabled = false;

      // Notification à l'utilisateur
      notificationService.show(errorTitle, "error", 5000);
    }
  } else {
    // Masquer le texte
    domRefs.surahText.style.display = "none";
    const showText = translationManager.t(
      "content.surah.showText",
      "Show Text"
    );
    domRefs.toggleTextBtn.innerHTML = `<span class="icon">👁</span> ${showText}`;
  }
}

async function handleEvaluation(event) {
  const button = event.target.closest(".surahmemorization-eval-btn");
  if (!button) return;

  const level = button.dataset.level;
  const currentSurah = surahsInRevision[currentSurahIndex];
  const currentLang = localStorage.getItem("userLang") || "fr";

  try {
    // Désactiver temporairement les boutons
    domRefs.evaluationButtons?.forEach((btn) => (btn.disabled = true));

    await api.post(`/surah-memorization/surahs/${currentSurah.number}`, {
      memorizationLevel: level,
      lastRevisionDate: new Date().toISOString().split("T")[0],
    });

    // Invalider le cache après mise à jour
    invalidateCache("all");

    if (currentSurahIndex < surahsInRevision.length - 1) {
      currentSurahIndex++;
      renderCurrentSurah();
      // Réactiver les boutons
      domRefs.evaluationButtons?.forEach((btn) => (btn.disabled = false));
    } else {
      // FIN DE LA SESSION
      notificationService.show("surah.revision.complete", "success");

      if (currentLang === "fr") {
        domRefs.currentSurahTitle.textContent =
          "🎉 Félicitations, session terminée !";
      } else {
        domRefs.currentSurahTitle.textContent =
          "🎉 Congratulations, revision session completed!";
      }

      if (domRefs.surahText) {
        domRefs.surahText.textContent = "";
        domRefs.surahText.style.display = "none";
      }
      if (domRefs.progressBarFill) domRefs.progressBarFill.style.width = "100%";
      if (domRefs.toggleTextBtn) domRefs.toggleTextBtn.disabled = true;

      setTimeout(() => {
        surahsInRevision = [];
        currentSurahIndex = 0;
      }, 2000);
    }
  } catch (error) {
    console.error("Error updating surah:", error);
    notificationService.show("surah.update.error", "error", 0);
    // Réactiver les boutons en cas d'erreur
    domRefs.evaluationButtons?.forEach((btn) => (btn.disabled = false));
  }
}

function handleHistoryFilter(e) {
  const filter = e.target.value.toLowerCase();
  const rows = domRefs.historyTable?.querySelectorAll("tr");
  rows?.forEach((row) => {
    const level = row
      .querySelector("td:nth-child(4)")
      ?.textContent.toLowerCase();
    row.style.display = filter === "all" || level === filter ? "" : "none";
  });
}

async function handleExport() {
  try {
    const data = await api.get("/surah-memorization/history");
    const historyData = data.history;

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Surah Name,Number,Revision Date,Level,Next Revision\n" +
      historyData
        .map(
          (entry) =>
            `${entry.name},${entry.number},${entry.lastRevisionDate},${
              entry.memorizationLevel || "N/A"
            },${entry.nextRevisionDate || "N/A"}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "revision_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notificationService.show("surah.export.success", "success");
  } catch (error) {
    console.error("Error exporting data:", error);
    notificationService.show("surah.export.error", "error", 0);
  }
}

async function handleClearHistory() {
  const confirmed = await notificationService.confirm("surah.history.clear");
  if (confirmed) {
    try {
      await api.delete("/surah-memorization/history");
      revisionHistory = [];

      // Invalider le cache après suppression
      invalidateCache("all");

      renderHistoryTable();
      renderHistoryCharts();
      notificationService.show("surah.history.cleared", "success");
    } catch (error) {
      console.error("Error clearing history:", error);
      notificationService.show("surah.history.clear.error", "error", 0);
    }
  }
}

/* ------------------ Fonction de nettoyage pour éviter les fuites mémoire ------------------ */
function cleanupSurahMemorization() {
  console.log("Nettoyage de SurahMemorization...");

  // Nettoyer les événements
  cleanupEventListeners();

  // Détruire les graphiques
  if (performanceChart) {
    performanceChart.destroy();
    performanceChart = null;
  }
  if (progressChart) {
    progressChart.destroy();
    progressChart = null;
  }

  // Réinitialiser les variables
  allSurahs = [];
  surahsInRevision = [];
  currentSurahIndex = 0;
  revisionHistory = [];
  isInitialized = false;
  isLoading = false;
  domRefs = {};

  // Arrêter l'audio en cours
  stopCurrentAudio();

  // Nettoyer le cache
  invalidateCache("all");

  console.log("Nettoyage de SurahMemorization terminé");
}

/* ------------------ Export des fonctions ------------------ */
export { initSurahMemorization, cleanupSurahMemorization };

/* ------------------ Fonctions utilitaires de cache ------------------ */
function invalidateCache(type = "all") {
  console.log(`🗑️ Invalidation du cache: ${type}`);
  switch (type) {
    case "surahs":
      dataCache.surahs = null;
      dataCache.timestamp = null;
      break;
    case "history":
      dataCache.history = null;
      dataCache.historyTimestamp = null;
      break;
    case "arabicTexts":
      dataCache.arabicTexts = {};
      break;
    case "audioCache":
      dataCache.audioCache = {};
      break;
    case "all":
    default:
      dataCache.surahs = null;
      dataCache.timestamp = null;
      dataCache.history = null;
      dataCache.historyTimestamp = null;
      dataCache.arabicTexts = {};
      dataCache.audioCache = {};
      break;
  }
}

function isCacheValid(timestamp) {
  return timestamp && Date.now() - timestamp < CACHE_DURATION;
}

async function loadSurahDataWithCache() {
  // Vérifier le cache en premier
  if (isCacheValid(dataCache.timestamp) && dataCache.surahs) {
    console.log("📄 Utilisation du cache pour les sourates");
    return { surahs: dataCache.surahs };
  }

  // Charger depuis l'API si pas de cache valide
  try {
    console.log("🔄 Chargement des sourates depuis l'API...");
    const data = await api.get("/surah-memorization/surahs");

    // Mettre à jour le cache
    dataCache.surahs = data.surahs;
    dataCache.timestamp = Date.now();

    console.log(`✅ ${data.surahs.length} sourates chargées et mises en cache`);
    return data;
  } catch (error) {
    console.error("❌ Erreur lors du chargement des sourates:", error);
    notificationService.show(
      "Erreur lors du chargement des sourates",
      "error",
      0
    );
    throw error;
  }
}

/* ------------------ Fonction de chargement du texte arabe ------------------ */
async function loadSurahArabicText(surahNumber) {
  // Vérifier le cache d'abord
  if (dataCache.arabicTexts[surahNumber]) {
    console.log(`📖 Utilisation du cache pour la sourate ${surahNumber}`);
    return dataCache.arabicTexts[surahNumber];
  }

  try {
    console.log(
      `🔄 Chargement du texte arabe pour la sourate ${surahNumber}...`
    );

    // Log spécial pour la sourate 9 (seule exception)
    if (surahNumber === 9) {
      console.log(
        `📖 Sourate 9 (At-Tawbah) - Pas de Basmallah, format original conservé`
      );
    } else {
      console.log(
        `📖 Sourate ${surahNumber} - Séparation de la Basmallah activée`
      );
    }

    const response = await fetch(
      `https://api.alquran.cloud/v1/surah/${surahNumber}`
    );

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !data.data.ayahs) {
      throw new Error("Format de données invalide");
    }

    // Formater le texte avec numéros de versets (1 verset par ligne)
    // Séparer la Basmallah du premier verset pour toutes les sourates
    // EXCEPTION UNIQUE : Sourate 9 (At-Tawbah/Le Repentir)
    // La sourate 9 ne commence pas par la Basmallah, donc pas de séparation nécessaire
    const formattedVerses = data.data.ayahs.map((ayah, index) => {
      if (index === 0 && surahNumber !== 9) {
        // Premier verset avec Basmallah - la séparer (toutes sourates sauf 9)
        let verseText = ayah.text;

        // Approche ultra-simple : pour les sourates (sauf 1 et 9), séparer automatiquement les 4 premiers mots
        const words = verseText.trim().split(/\s+/);

        // Si le premier verset a plus de 4 mots, séparer automatiquement les 4 premiers (Basmallah)
        if (words.length >= 5) {
          // Les 4 premiers mots constituent toujours la Basmallah
          const basmallahPart = words.slice(0, 4).join(" ");

          // Le reste constitue le verset proprement dit
          const remainingVerse = words.slice(4).join(" ");

          // Retourner la Basmallah séparément puis le verset (seulement si le verset n'est pas vide)
          if (remainingVerse) {
            return [
              `بسم الله ${basmallahPart}`,
              `${ayah.numberInSurah} ${remainingVerse}`,
            ];
          } else {
            return [`بسم الله ${basmallahPart}`];
          }
        }
      }
      // Pour la sourate 9 uniquement, garder le format original
      return [`${ayah.numberInSurah} ${ayah.text}`];
    });

    const formattedText = formattedVerses.flat().join("\n");

    // Mettre en cache
    dataCache.arabicTexts[surahNumber] = formattedText;

    console.log(
      `✅ Texte arabe chargé et mis en cache pour la sourate ${surahNumber}`
    );
    return formattedText;
  } catch (error) {
    console.error(
      `❌ Erreur lors du chargement du texte pour la sourate ${surahNumber}:`,
      error
    );
    throw error;
  }
}
