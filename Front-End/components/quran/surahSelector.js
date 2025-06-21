// surahSelector.js

import { navigateTo } from "../../utils/utils.js";
import { api } from "../../services/api/dynamicLoader.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import { translationManager } from "../../translations/TranslationManager.js";

// --- Variables globales ---
const sourates = [];
let knownSourates = [];
let recitationCycles = 0;
let recitationProgress = { totalKnown: 0, recitedAtLeastOnce: 0 };
let cyclesCount = 0;
let isSelecting = false;
let cachedKnownSourates = null;

// Flag d'initialisation pour éviter les doublons d'écouteurs et d'appels
let surahSelectorInitialized = false;

/**
 * Point d'entrée principal pour initialiser le sélecteur de sourates.
 * L'initialisation ne se fait qu'une seule fois.
 */
function initializeSurahSelector() {
  if (surahSelectorInitialized) {
    console.log("SurahSelector déjà initialisé.");
    return;
  }
  const surahSelectorSection = document.getElementById("salatSurahSelector");
  if (surahSelectorSection) {
    // Attache un unique handler pour les clics
    surahSelectorSection.addEventListener("click", handleSectionClick);
    surahSelectorInitialized = true;
    // Lancement de l'initialisation de l'application
    initializeApplication();
  } else {
    console.error("Élément #salatSurahSelector non trouvé dans le DOM.");
  }
}

/**
 * Gestionnaire global des clics sur la section.
 */
function handleSectionClick(event) {
  const target = event.target.closest("[data-action]");
  if (target) {
    const action = target.getAttribute("data-action");
    switch (action) {
      case "save-known-sourates":
        saveKnownSourates();
        break;
      case "select-random-sourates":
        selectRandomSourates();
        break;
      default:
        console.warn("Action inconnue :", action);
    }
  }
}

/**
 * Initialisation asynchrone de l'application :
 * chargement des sourates, des sourates à réciter, des statistiques, et mise à jour de l'UI.
 */
async function initializeApplication() {
  try {
    await loadAllSourates();
    await loadKnownSourates();
    const recitationData = await loadRecitationInfo();
    generateSourateList();
    updateKnownSouratesCount();
    updateRecitationInfo(recitationData);
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error);
    notificationService.show("surah.load_error", "error", 0);
  }
}

/**
 * Chargement de toutes les sourates depuis l'API.
 */
async function loadAllSourates() {
  try {
    const data = await api.get("/sourates");
    sourates.length = 0;
    sourates.push(...data);
  } catch (error) {
    console.error("Erreur lors du chargement des sourates:", error);
    notificationService.show("surah.load_error", "error", 0);
    throw error;
  }
}

/**
 * Chargement des sourates à réciter depuis l'API (avec sauvegarde en localStorage en cas d'erreur).
 */
async function loadKnownSourates() {
  try {
    const data = await api.get("/sourates/known");
    // On conserve uniquement les numéros valides
    knownSourates = data
      .filter((s) => s && s.sourate_number)
      .map((s) => s.sourate_number);
    localStorage.setItem("knownSourates", JSON.stringify(knownSourates));
  } catch (error) {
    console.error("Erreur lors du chargement des sourates à réciter:", error);
    // En cas d’échec, on tente de récupérer la liste depuis le localStorage
    knownSourates = JSON.parse(localStorage.getItem("knownSourates") || "[]");
    notificationService.show("surah.load_error", "error", 0);
  }
}

/**
 * Sauvegarde des sourates cochées comme sourates à réciter.
 */
async function saveKnownSourates() {
  // On récupère la liste des cases cochées
  const selectedSourates = Array.from(
    new Set(
      Array.from(
        document.querySelectorAll('#sourateList input[type="checkbox"]')
      )
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => parseInt(checkbox.value))
    )
  );

  try {
    await api.post("/sourates/known", { sourates: selectedSourates });
    knownSourates = selectedSourates;
    localStorage.setItem("knownSourates", JSON.stringify(knownSourates));
    updateKnownSouratesCount();
    notificationService.show("surah.saved", "success");
  } catch (error) {
    console.error(
      "Erreur lors de la sauvegarde des sourates à réciter:",
      error
    );
    notificationService.show("surah.save_error", "error", 0);
  }
}

/**
 * Génération dynamique de la liste des sourates à cocher.
 */
function generateSourateList() {
  console.log("Début de la génération de la liste des sourates");
  const sourateList = document.getElementById("sourateList");
  if (!sourateList) {
    console.error("Élément #sourateList non trouvé dans le DOM.");
    return;
  }

  sourateList.innerHTML = "";

  // On parcourt la liste des sourates à l'envers (si besoin de cet ordre)
  for (let i = sourates.length - 1; i >= 0; i--) {
    const sourate = sourates[i];
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `sourate-${sourate.number}`;
    checkbox.value = sourate.number;
    if (knownSourates.includes(sourate.number)) {
      checkbox.checked = true;
      console.log(`Sourate ${sourate.number} cochée`);
    }

    const label = document.createElement("label");
    label.htmlFor = `sourate-${sourate.number}`;
    label.textContent = `${sourate.number}. ${sourate.name} (${sourate.arabic})`;

    const listItem = document.createElement("div");
    listItem.className = "sourate-item";
    listItem.appendChild(checkbox);
    listItem.appendChild(label);

    sourateList.appendChild(listItem);
  }
  console.log("Fin de la génération de la liste des sourates");
}

/**
 * Mise à jour du compteur de sourates à réciter dans l'interface.
 */
function updateKnownSouratesCount() {
  const countElement = document.getElementById("knownSouratesCount");
  if (countElement) {
    // Détection de la langue basée sur la langue du document HTML
    const currentLang =
      document.documentElement.lang || localStorage.getItem("userLang") || "fr";
    const text =
      currentLang === "en"
        ? `Surahs to Recite: <strong>${knownSourates.length}</strong>`
        : `Sourates à réciter : <strong>${knownSourates.length}</strong>`;
    countElement.innerHTML = text;
  }
}

/**
 * Chargement des informations de récitation (stats) depuis l'API.
 */
async function loadRecitationInfo() {
  try {
    console.log("Début du chargement des informations de récitation");
    const data = await api.get("/sourates/recitations/stats");
    console.log("Statistiques reçues:", data);

    return {
      cycles: data.complete_cycles || 0,
      recited_at_least_once: data.recited_at_least_once || 0,
      total_known: data.total_known || 0,
    };
  } catch (error) {
    console.error(
      "Erreur lors du chargement des informations de récitation:",
      error
    );
    return { cycles: 0, recited_at_least_once: 0, total_known: 0 };
  }
}

/**
 * Sélection aléatoire de sourates à réciter.
 */
async function selectRandomSourates() {
  if (isSelecting) {
    notificationService.show("surah.selection_in_progress", "warning");
    return;
  }

  isSelecting = true;

  try {
    const knownSouratesData = await getKnownSouratesOnce();

    // Vérification : il faut au moins une sourate à réciter
    if (!knownSouratesData || knownSouratesData.length < 1) {
      notificationService.show("surah.select_one", "warning");
      return;
    }

    // Récupérer les sourates non encore récitées
    const notRecitedSourates = await getNotRecitedSourates();

    // Cas particulier : il ne reste plus qu’une sourate non récitée
    if (notRecitedSourates.length === 1) {
      const lastSourate = notRecitedSourates[0];
      updateUIWithSelectedSourates(lastSourate, lastSourate);

      const recitationResult = await api.post("/sourates/recitations", {
        firstSourate: lastSourate.number,
        secondSourate: lastSourate.number,
      });

      await getRecitationStats();

      if (recitationResult.cycleCompleted) {
        notificationService.show("surah.cycle_complete", "success");
      }
      return;
    }

    // Si toutes les sourates ont été récitées, démarrer un nouveau cycle
    let selectableSourates = [...notRecitedSourates];
    if (selectableSourates.length === 0) {
      notificationService.show("surah.new_cycle", "info");
      const allKnownSourateNumbers = knownSouratesData.map(
        (s) => s.sourate_number
      );
      const allKnownSouratesData = await api.post("/sourates/by-numbers", {
        sourateNumbers: allKnownSourateNumbers,
      });
      selectableSourates = allKnownSouratesData;
    }

    // Pioche de 2 sourates distinctes (ou identiques si aucune autre option)
    const [firstSourate, secondSourate] =
      selectTwoRandomSourates(selectableSourates);
    updateUIWithSelectedSourates(firstSourate, secondSourate);

    // Enregistrement de la récitation
    const recitationResult = await api.post("/sourates/recitations", {
      firstSourate: firstSourate.number,
      secondSourate: secondSourate.number,
    });

    // Mise à jour des stats
    const stats = await api.get("/sourates/recitations/stats");
    updateRecitationInfo(stats);
    notificationService.show("surah.selected", "success");

    // Si un cycle est complété, afficher un message et mettre à jour les stats après délai
    if (recitationResult.cycleCompleted) {
      notificationService.show("surah.cycle_complete", "success");
      setTimeout(async () => {
        const updatedStats = await api.get("/sourates/recitations/stats");
        updateRecitationInfo(updatedStats);
      }, 1000);
    }
  } catch (error) {
    console.error("Erreur dans selectRandomSourates:", error);
    notificationService.show("surah.selection_error", "error", 0);
  } finally {
    isSelecting = false;
    // Invalider le cache après 5 secondes
    setTimeout(() => {
      cachedKnownSourates = null;
    }, 5000);
  }
}

/**
 * Sélectionne deux sourates aléatoires distinctes (ou identiques si nécessaire).
 */
function selectTwoRandomSourates(sourates) {
  const shuffledSourates = [...sourates].sort(() => Math.random() - 0.5);
  let firstSourate = shuffledSourates[0];
  let secondSourate =
    shuffledSourates.find((s) => s.number !== firstSourate.number) ||
    firstSourate;

  // On s’assure que la première sourate a un numéro inférieur à la deuxième
  if (firstSourate.number > secondSourate.number) {
    [firstSourate, secondSourate] = [secondSourate, firstSourate];
  }

  return [firstSourate, secondSourate];
}

/**
 * Mise à jour de l'interface avec les sourates sélectionnées.
 */
function updateUIWithSelectedSourates(firstSourate, secondSourate) {
  const firstRakaElement = document.getElementById("firstRaka");
  const secondRakaElement = document.getElementById("secondRaka");

  if (firstRakaElement) {
    firstRakaElement.innerHTML = `<strong>${firstSourate.number}. ${firstSourate.name}</strong>`;
  }

  if (secondRakaElement) {
    secondRakaElement.innerHTML = `<strong>${secondSourate.number}. ${secondSourate.name}</strong>`;
  }
}

/**
 * Récupération (avec cache) des sourates à réciter.
 */
async function getKnownSouratesOnce() {
  if (cachedKnownSourates) {
    return cachedKnownSourates;
  }
  const data = await api.get("/sourates/known");
  cachedKnownSourates = data;
  return data;
}

/**
 * Récupération des sourates non encore récitées.
 */
async function getNotRecitedSourates() {
  const notRecitedSourates = await api.get("/sourates/recitations/not-recited");
  return notRecitedSourates;
}

/**
 * Récupère les statistiques de récitation et met à jour l'interface.
 */
async function getRecitationStats() {
  try {
    const stats = await api.get("/sourates/recitations/stats");
    console.log("Statistiques récupérées:", stats);
    updateRecitationInfo(stats);
  } catch (error) {
    console.error("Erreur:", error);
    notificationService.show("surah.load_error", "error", 0);
  }
}

/**
 * Mise à jour des informations de récitation (cycles & progression) dans l'interface.
 */
function updateRecitationInfo(data) {
  const cyclesElement = document.getElementById("recitationCyclesCount");
  const progressElement = document.getElementById("recitationProgress");

  if (!data) {
    console.error(
      "Pas de données reçues pour la mise à jour des informations de récitation"
    );
    return;
  }

  // Sauvegarder les stats pour les changements de langue
  window.lastRecitationStats = data;

  // Utiliser le nouveau gestionnaire de traductions

  // Mise à jour des cycles
  if (cyclesElement) {
    const cycles = data.complete_cycles || data.cycles || 0;
    const cyclesText = translationManager
      .t("content.surah.cycles", "Complete Recitation Cycles: {cycles}")
      .replace("{cycles}", `<strong>${cycles}</strong>`);
    cyclesElement.innerHTML = cyclesText;
  }

  // Mise à jour de la progression
  if (progressElement) {
    const recited = data.recited_at_least_once || 0;
    const total = data.total_known || 0;
    const progressText = translationManager
      .t(
        "content.surah.progress",
        "Progress: {recited} / {total} surahs recited"
      )
      .replace("{recited}", `<strong>${recited}</strong>`)
      .replace("{total}", `<strong>${total}</strong>`);
    progressElement.innerHTML = progressText;
  }
}

// --- Écouter les changements de langue pour mettre à jour les contenus dynamiques ---
document.addEventListener("languageChanged", () => {
  // Re-mettre à jour les informations de récitation après changement de langue
  const lastStats = window.lastRecitationStats;
  if (lastStats) {
    updateRecitationInfo(lastStats);
  }
});

// --- Export de la fonction d'initialisation principale ---
export { initializeSurahSelector };
