// surahMemorization.js

import { api } from "../../services/api/dynamicLoader.js";
import { notificationService } from "../../services/notifications/notificationService.js";

// Variables globales
let allSurahs = [];
let surahsInRevision = [];
let surahs = [];
let currentSurahIndex = 0;
let revisionHistory = [];
let progressChart = null;
let performanceChart = null;
let surahsToRevise = [];

// Constantes
const levelColors = {
  Strong: "rgb(34, 197, 94)", // Vert
  Good: "rgb(59, 130, 246)", // Bleu
  Moderate: "rgb(234, 179, 8)", // Jaune
  Weak: "rgb(239, 68, 68)", // Rouge
};

// Références DOM
const navButtons = document.querySelectorAll(".quran-app-nav-button");
const sections = document.querySelectorAll(".quran-app-section");
const surahList = document.getElementById("surahmemorization-list");
const searchInput = document.getElementById("surahmemorization-search");
const filterSelect = document.getElementById("surahmemorization-filter");
const toggleAllBtn = document.getElementById("surahmemorization-toggle-all");
const selectedCountSpan = document.getElementById("surahmemorization-count");
const startRevisionBtn = document.getElementById("surahmemorization-start");
const currentSurahTitle = document.getElementById(
  "surahmemorization-current-title"
);
const surahProgress = document.getElementById("surahmemorization-progress");
const surahText = document.getElementById("surahmemorization-text");
const toggleTextBtn = document.getElementById("surahmemorization-toggle-text");
const evaluationButtons = document.querySelectorAll(
  ".surahmemorization-eval-btn"
);
const progressBarFill = document.querySelector(
  ".surahmemorization-progress-bar-fill"
);
const historyFilter = document.getElementById(
  "surahmemorization-history-filter"
);
const historyTable = document
  .getElementById("surahmemorization-history-table")
  ?.querySelector("tbody");
const exportBtn = document.getElementById("surahmemorization-export");
const clearHistoryBtn = document.getElementById("surahmemorization-clear");
const saveButton = document.getElementById("surahmemorization-save");

/* ------------------ Fonctions utilitaires ------------------ */
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
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getLevelClass(level) {
  if (!level) return "surahmemorization-level-na";
  return `surahmemorization-level-${level.toLowerCase()}`;
}

/* ------------------ Fonction de chargement des sourates ------------------ */
async function loadSurahs() {
  try {
    const data = await api.get("/surah-memorization/surahs");
    surahs = data.surahs.map((surah) => ({
      number: surah.number,
      name: surah.name,
      arabic: surah.arabic,
      memorizationLevel: surah.memorizationLevel || null,
      lastRevisionDate: surah.lastRevisionDate || null,
      isSelected: surah.isKnown,
    }));
    renderSurahList();
    updateSelectedCount();
    renderCurrentSurah();
  } catch (error) {
    console.error("Error loading surahs:", error);
    notificationService.show("surah.load.error", "error", 0);
  }
}

/* ------------------ Rendu de la liste des sourates ------------------ */
function renderSurahList() {
  let container = document.getElementById("surahmemorization-list-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "surahmemorization-list-container";
    document.querySelector("#surahmemorization-select").appendChild(container);

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

  surahList.innerHTML = "";
  surahs.forEach((surah) => {
    const surahItem = document.createElement("div");
    surahItem.className = "surahmemorization-item";
    surahItem.innerHTML = `
            <div class="item-left">
                <input type="checkbox" id="surah-${surah.number}" ${
      surah.isSelected ? "checked" : ""
    }>
                <label for="surah-${surah.number}">
                    <span class="surah-name">${surah.name}</span>
                    <span class="surah-number">(${surah.number})</span>
                </label>
            </div>
            <div class="item-center">
                <span class="memorization-level ${getLevelClass(
                  surah.memorizationLevel
                )}">
                    ${
                      surah.memorizationLevel && window.translationManager
                        ? window.translationManager.t(
                            `surahmemorization.levels.${surah.memorizationLevel}`
                          )
                        : surah.memorizationLevel || "N/A"
                    }
                </span>
            </div>
            <div class="item-right">
                ${formatDate(surah.lastRevisionDate)}
            </div>
        `;

    // On met à jour la logique de la checkbox pour utiliser notificationService
    const checkbox = surahItem.querySelector("input");
    updateSurahCheckbox(surah, checkbox);

    surahList.appendChild(surahItem);
  });
}

/* ------------------ Mise à jour du checkbox d'une sourate ------------------ */
function updateSurahCheckbox(surah, checkbox) {
  checkbox.addEventListener("change", (e) => {
    surah.isSelected = e.target.checked;
    updateSelectedCount();
    // Plus d'appel API ici
  });
}

/* ------------------ Mise à jour du compteur de sourates sélectionnées ------------------ */
function updateSelectedCount() {
  const selectedCount = surahs.filter((surah) => surah.isSelected).length;
  const translatedText = window.translationManager
    ? window.translationManager.translateDynamic(
        "surahmemorization.surahsSelected",
        {
          count: selectedCount,
        }
      )
    : `${selectedCount} surahs selected`;
  selectedCountSpan.textContent = translatedText;
  startRevisionBtn.disabled = selectedCount === 0;
}

/* ------------------ Rendu de la liste filtrée ------------------ */
function renderFilteredSurahList(filteredSurahs) {
  if (!surahList) return;
  surahList.innerHTML = "";

  filteredSurahs.forEach((surah) => {
    const surahItem = document.createElement("div");
    surahItem.className = "surahmemorization-item";
    surahItem.innerHTML = `
            <div class="item-left">
                <input type="checkbox" id="surah-${surah.number}" ${
      surah.isSelected ? "checked" : ""
    }>
                <label for="surah-${surah.number}">
                    <span class="surah-name">${surah.name}</span>
                    <span class="surah-number">(${surah.number})</span>
                </label>
            </div>
            <div class="item-center">
                <span class="memorization-level ${getLevelClass(
                  surah.memorizationLevel
                )}">
                    ${
                      surah.memorizationLevel && window.translationManager
                        ? window.translationManager.t(
                            `surahmemorization.levels.${surah.memorizationLevel}`
                          )
                        : surah.memorizationLevel || "N/A"
                    }
                </span>
            </div>
            <div class="item-right">
                ${formatDate(surah.lastRevisionDate)}
            </div>
        `;

    const checkbox = surahItem.querySelector("input");
    updateSurahCheckbox(surah, checkbox);

    surahList.appendChild(surahItem);
  });
}

/* ------------------ Rendu de la sourate en cours ------------------ */
function renderCurrentSurah() {
  // On prend la sourate courante dans le tableau réduit
  const currentSurah = surahsInRevision[currentSurahIndex];
  if (!currentSurah) return; // Sécurité si index hors limites

  currentSurahTitle.textContent = currentSurah.name;

  // Mise à jour du texte, reset du bouton Show/Hide
  surahText.textContent = currentSurah.arabic;
  surahText.style.display = "none";
  toggleTextBtn.innerHTML = '<span class="icon">👁</span> Show Text';

  // Exemple : "Surah 1 of 3"
  surahProgress.textContent = `Surah ${currentSurahIndex + 1} of ${
    surahsInRevision.length
  }`;

  // Barre de progression
  const progressPercentage =
    ((currentSurahIndex + 1) / surahsInRevision.length) * 100;
  progressBarFill.style.width = `${progressPercentage}%`;
}

/* ------------------ Rendu des graphiques (historique/performance) ------------------ */
async function renderHistoryCharts() {
  const ctx = document
    .getElementById("surahmemorization-performance-chart")
    ?.getContext("2d");
  if (!ctx) return;

  try {
    if (typeof Chart === "undefined") {
      console.error("Chart.js n'est pas chargé");
      return;
    }

    const data = await api.get("/surah-memorization/history");
    const historyData = data.history;

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
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20,
              font: {
                size: 14,
              },
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
            text: "",
            padding: { top: 10, bottom: 30 },
            font: { size: 18, weight: "bold" },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error loading history:", error);
    notificationService.show("surah.history.load.error", "error", 0);
  }
}

/* ------------------ Rendu du tableau de l'historique ------------------ */
async function renderHistoryTable() {
  if (!historyTable) return;

  historyTable.innerHTML = "";
  try {
    const data = await api.get("/surah-memorization/history");
    const historyData = data.history;

    historyData.forEach((entry) => {
      const row = document.createElement("tr");
      const translatedLevel =
        entry.memorizationLevel && window.translationManager
          ? window.translationManager.t(
              `surahmemorization.levels.${entry.memorizationLevel}`
            )
          : entry.memorizationLevel || "N/A";
      row.innerHTML = `
                <td>${entry.name}</td>
                <td>${entry.number}</td>
                <td>${formatDate(entry.lastRevisionDate)}</td>
                <td class="${getLevelClass(
                  entry.memorizationLevel
                )}">${translatedLevel}</td>
                <td>${formatDate(entry.nextRevisionDate)}</td>
            `;
      historyTable.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading history:", error);
    notificationService.show("surah.history.load.error", "error", 0);
  }
}

/* ------------------ Initialisation du module de mémorisation ------------------ */
function initSurahMemorization() {
  document.getElementById("surahmemorization-select").style.display = "block";
  document.getElementById("surahmemorization-history").style.display = "none";
  loadSurahs();

  // Écouter les changements de langue pour mettre à jour les traductions dynamiques
  if (window.translationManager) {
    window.translationManager.onLanguageChange(() => {
      // Recharger le tableau d'historique avec les nouvelles traductions
      renderHistoryTable();
      // Mettre à jour le compteur de sourates sélectionnées
      updateSelectedCount();
      // Recharger la liste des sourates avec les niveaux traduits
      renderSurahList();
    });
  }
}

/* ------------------ Gestion des événements (navigation) ------------------ */
navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetSection = button.dataset.target;

    sections.forEach((section) => {
      section.style.display =
        section.id === `surahmemorization-${targetSection}` ? "block" : "none";
    });

    if (targetSection === "revise") {
      onReviseTabClicked();
    } else if (targetSection === "history") {
      renderHistoryCharts();
      renderHistoryTable();
    }
  });
});

function onReviseTabClicked() {
  // 1) On récupère la langue
  const currentLang = localStorage.getItem("userLang") || "fr";

  // 2) Vérifier si la révision a été démarrée
  if (!surahsInRevision || surahsInRevision.length === 0) {
    // Texte en fonction de la langue
    if (currentLang === "fr") {
      currentSurahTitle.textContent =
        'Veuillez d\'abord démarrer une session de révision dans la partie "Select Surah".';
    } else {
      currentSurahTitle.textContent =
        "Please start a revision session in the 'Select Surah' section first.";
    }

    // Désactiver les boutons
    evaluationButtons.forEach((btn) => (btn.disabled = true));
    toggleTextBtn.disabled = true;

    // Vider ou masquer le texte
    surahText.style.display = "none";
    progressBarFill.style.width = "0%";
  } else {
    // Session de révision démarrée : activer les boutons
    evaluationButtons.forEach((btn) => (btn.disabled = false));
    toggleTextBtn.disabled = false;

    // Afficher la sourate en cours
    renderCurrentSurah();
  }
}
/* ------------------ Bouton de sauvegarde ------------------ */
saveButton?.addEventListener("click", async () => {
  const selectedSurahs = surahs
    .filter((surah) => surah.isSelected)
    .map((surah) => surah.number);
  if (selectedSurahs.length === 0) {
    notificationService.show("surah.memorization.save", "warning");
    return;
  }

  try {
    // Seul endroit où on enregistre les sourates dans la base de données
    await api.post("/surah-memorization/known", { sourates: selectedSurahs });
    notificationService.show("surah.memorization.saved", "success");
  } catch (error) {
    console.error("Error saving known surahs:", error);
    notificationService.show("surah.save.error", "error", 0);
  }
});
/* ------------------ Recherche (filtrage par nom / numéro) ------------------ */
searchInput?.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filteredSurahs = surahs.filter(
    (surah) =>
      surah.name.toLowerCase().includes(searchTerm) ||
      surah.number.toString().includes(searchTerm)
  );
  renderFilteredSurahList(filteredSurahs);
});

/* ------------------ Filtrage avancé (niveau, ordre alphabétique, etc.) ------------------ */
filterSelect?.addEventListener("change", (e) => {
  const filterValue = e.target.value;
  let filteredSurahs = [...surahs];

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
    case "alphabetical":
      filteredSurahs.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "numerical":
      filteredSurahs.sort((a, b) => a.number - b.number);
      break;
  }
  renderFilteredSurahList(filteredSurahs);
});

/* ------------------ Bouton pour démarrer la révision ------------------ */
startRevisionBtn?.addEventListener("click", () => {
  const selectedSurahs = surahs.filter((s) => s.isSelected);
  if (selectedSurahs.length === 0) {
    notificationService.show("Aucune sourate sélectionnée.", "error");
    return;
  }

  // On remplit la liste de révision
  surahsInRevision = [...selectedSurahs];
  currentSurahIndex = 0;

  // On peut même, si on veut, basculer directement vers la partie "Revise"
  document.getElementById("surahmemorization-revise").style.display = "block";
  document.getElementById("surahmemorization-select").style.display = "none";

  // Et on affiche la première sourate
  renderCurrentSurah();
});

/* ------------------ Bouton pour afficher/masquer le texte de la sourate ------------------ */
toggleTextBtn?.addEventListener("click", () => {
  if (surahText.style.display === "none") {
    surahText.style.display = "block";
    toggleTextBtn.innerHTML = '<span class="icon">👁</span> Hide Text';
  } else {
    surahText.style.display = "none";
    toggleTextBtn.innerHTML = '<span class="icon">👁</span> Show Text';
  }
});

/* ------------------ Évaluation (boutons Strong, Good, etc.) ------------------ */
evaluationButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const level = button.dataset.level;
    const currentSurah = surahsInRevision[currentSurahIndex];
    const currentLang = localStorage.getItem("userLang") || "fr"; // Récupérer la langue courante

    try {
      // 1) Mettre à jour la sourate dans la BD
      await api.post(`/surah-memorization/surahs/${currentSurah.number}`, {
        memorizationLevel: level,
        lastRevisionDate: new Date().toISOString().split("T")[0],
      });

      // 2) Vérifier s'il reste des sourates à réviser
      if (currentSurahIndex < surahsInRevision.length - 1) {
        currentSurahIndex++;
        renderCurrentSurah();
      } else {
        // --------------------------------------
        // FIN DE LA SESSION DE RÉVISION
        // --------------------------------------

        // Notification de fin (en utilisant translations.js si vous voulez)
        notificationService.show("surah.revision.complete", "success");

        // Désactiver les boutons d’évaluation et le bouton "Show/Hide Text"
        evaluationButtons.forEach((btn) => (btn.disabled = true));
        toggleTextBtn.disabled = true;

        // Message de félicitations selon la langue
        if (currentLang === "fr") {
          currentSurahTitle.textContent = "Félicitations, session terminée !";
        } else {
          currentSurahTitle.textContent =
            "Congratulations, you have finished your revision session!";
        }

        // Vider ou masquer le texte de la sourate
        surahText.textContent = "";
        surahText.style.display = "none";

        // Mettre la barre de progression à 100%
        progressBarFill.style.width = "100%";
      }
    } catch (error) {
      console.error("Error updating surah:", error);
      notificationService.show("surah.update.error", "error", 0);
    }
  });
});

/* ------------------ Filtrage de l'historique ------------------ */
historyFilter?.addEventListener("change", (e) => {
  const filter = e.target.value.toLowerCase();
  const rows = historyTable.querySelectorAll("tr");
  rows.forEach((row) => {
    const level = row
      .querySelector("td:nth-child(4)")
      .textContent.toLowerCase();
    row.style.display = filter === "all" || level === filter ? "" : "none";
  });
});

/* ------------------ Export de l'historique (CSV) ------------------ */
exportBtn?.addEventListener("click", async () => {
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
});

/* ------------------ Suppression de l'historique ------------------ */
clearHistoryBtn?.addEventListener("click", async () => {
  const confirmed = await notificationService.confirm("surah.history.clear");
  if (confirmed) {
    try {
      await api.delete("/surah-memorization/history");
      revisionHistory = [];
      renderHistoryTable();
      renderHistoryCharts();
      notificationService.show("surah.history.cleared", "success");
    } catch (error) {
      console.error("Error clearing history:", error);
      notificationService.show("surah.history.clear.error", "error", 0);
    }
  }
});

/* ------------------ Export de la fonction d'initialisation ------------------ */
export { initSurahMemorization };
