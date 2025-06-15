import { ChartManager } from "../../components/statistics/charts.js";
import AppState from "../../services/state/state.js";
const appState = AppState;

class StatisticsManager {
  constructor() {
    console.debug("[StatisticsManager] constructor: Initializing...");
    // Flag pour éviter les initialisations multiples
    this.statisticsInitialized = false;

    // Le cache contiendra uniquement les enregistrements existants
    this.cache = {
      daily: { dates: [], dataMap: new Map(), lastFetch: null },
      weekly: { dates: [], dataMap: new Map(), lastFetch: null },
      monthly: { dates: [], dataMap: new Map(), lastFetch: null },
      yearly: { dates: [], dataMap: new Map(), lastFetch: null },
    };

    // Pour chaque période, l’index courant dans le tableau des enregistrements
    // (index 0 = le plus récent)
    this.currentPeriodIndex = {
      daily: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0,
    };

    // Périodes gérées
    this.periods = ["daily", "weekly", "monthly", "yearly"];
    // Nombre maximum d'enregistrements à afficher pour chaque période
    this.periodLimits = {
      daily: 7,
      weekly: 4,
      monthly: 12,
      yearly: 2,
    };
  }

  async fetchAndCacheData(period) {
    console.debug(
      `[StatisticsManager] fetchAndCacheData(${period}): Start fetching data...`
    );
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("[StatisticsManager] No token found.");
        return false;
      }

      const response = await fetch(`/api/statistics/${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const result = await response.json();
      console.debug(
        `[StatisticsManager] fetchAndCacheData(${period}): Response received:`,
        result
      );

      if (result.status === "success" && Array.isArray(result.data)) {
        this.updateCache(period, result.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        `[StatisticsManager] Error in fetchAndCacheData(${period}):`,
        error
      );
      return false;
    }
  }

  /**
   * Met à jour le cache pour une période donnée en utilisant uniquement
   * les enregistrements existants renvoyés par la base.
   * Les données sont triées par date décroissante (le plus récent en premier)
   * et limitées au maximum défini (7 pour daily, 4 pour weekly, etc.).
   */
  updateCache(period, data) {
    console.debug(
      `[StatisticsManager] updateCache(${period}): Updating cache with server data:`,
      data
    );
    const cache = this.cache[period];
    cache.dates = [];
    cache.dataMap.clear();

    // Tri décroissant : le plus récent en premier
    const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
    const maxRecords = this.periodLimits[period];
    // Limiter aux enregistrements existants (au maximum maxRecords)
    const limitedData = sortedData.slice(0, maxRecords);
    console.debug(
      `[StatisticsManager] updateCache(${period}): Limited data:`,
      limitedData
    );

    limitedData.forEach((record) => {
      // On crée une clé de la forme "YYYY-MM-DD" pour chaque enregistrement
      const dateKey = this.formatKey(new Date(record.date));
      cache.dates.push(dateKey);
      cache.dataMap.set(dateKey, record);
    });

    cache.lastFetch = Date.now();
    console.debug(
      `[StatisticsManager] updateCache(${period}): Cache updated. Total dates: ${cache.dates.length}, Records: ${cache.dataMap.size}`
    );
  }

  // Retourne une chaîne "YYYY-MM-DD" pour une date donnée
  formatKey(date) {
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  getCurrentDateForPeriod(period) {
    const cache = this.cache[period];
    const index = this.currentPeriodIndex[period];
    console.debug(
      `[StatisticsManager] getCurrentDateForPeriod(${period}): Current index: ${index}, Date: ${cache.dates[index]}`
    );
    return cache.dates[index];
  }

  getDataForDate(period, dateKey) {
    return this.cache[period].dataMap.get(dateKey);
  }

  async updatePeriodData(period, forceRefresh = false) {
    console.debug(
      `[StatisticsManager] updatePeriodData(${period}): Updating period data... forceRefresh=${forceRefresh}`
    );
    try {
      // Si aucun enregistrement n'est présent ou si on force le rafraîchissement, on récupère les données depuis le serveur
      if (this.cache[period].dates.length === 0 || forceRefresh) {
        console.debug(
          `[StatisticsManager] updatePeriodData(${period}): ${
            forceRefresh ? "Force refresh requested" : "Cache empty"
          }, fetching data...`
        );
        if (!(await this.fetchAndCacheData(period))) {
          throw new Error("Unable to load data");
        }
      }

      // Si toujours pas de données après le fetch (historique vide)
      if (this.cache[period].dates.length === 0) {
        console.debug(
          `[StatisticsManager] updatePeriodData(${period}): No data available, showing empty state`
        );
        ChartManager.updateChart(period, ["Aucune donnée"], [0], [0], []);
        this.updateNavigationButtons(period);
        return;
      }

      const currentDateKey = this.getCurrentDateForPeriod(period);
      if (!currentDateKey) {
        throw new Error("Invalid date");
      }
      const record = this.getDataForDate(period, currentDateKey);
      console.debug(
        `[StatisticsManager] updatePeriodData(${period}): Record for ${currentDateKey}:`,
        record
      );
      this.displayRecord(period, record);
      this.updateNavigationButtons(period);
    } catch (error) {
      console.error(
        `[StatisticsManager] updatePeriodData(${period}) Error:`,
        error
      );
      ChartManager.updateChart(period, ["Aucune donnée"], [0], [0], []);
      this.updateNavigationButtons(period);
    }
  }

  /**
   * Navigation avec les boutons prev/next.
   * Pour l’option utilisée ici (index 0 = enregistrement le plus récent) :
   * - Bouton "prev" (+1) : aller vers un enregistrement plus ancien.
   * - Bouton "next" (-1) : revenir vers un enregistrement plus récent.
   */
  navigatePeriod(period, direction) {
    try {
      const cache = this.cache[period];
      const newIndex = this.currentPeriodIndex[period] + direction;
      if (newIndex < 0 || newIndex >= cache.dates.length) {
        console.debug(
          `[StatisticsManager] navigatePeriod(${period}): Navigation out of bounds. newIndex=${newIndex}, valid range=0-${
            cache.dates.length - 1
          }`
        );
        return;
      }
      console.debug(
        `[StatisticsManager] navigatePeriod(${period}): Navigating from index ${this.currentPeriodIndex[period]} to ${newIndex}`
      );
      this.currentPeriodIndex[period] = newIndex;
      // Pas de force refresh lors de la navigation, on utilise le cache
      this.updatePeriodData(period, false);
    } catch (error) {
      console.error(
        `[StatisticsManager] navigatePeriod(${period}) Error:`,
        error
      );
    }
  }

  /**
   * Affiche l'enregistrement correspondant à la période en cours.
   * Pour daily, le format sera par exemple "vendredi 31 janvier 2025".
   * Pour weekly, on affiche la date de début de la semaine sous la forme "Week of January 27, 2025".
   */
  displayRecord(period, record) {
    try {
      if (!record || !record.date) {
        throw new Error("Invalid record");
      }
      const dateObj = new Date(record.date);
      const label = this.formatDate(dateObj, period);
      const timeMinutes = Math.round((record.total_time || 0) / 60);
      const count = record.total_count || 0;
      const tasks = record.task_details || [];
      ChartManager.updateChart(period, [label], [timeMinutes], [count], tasks);

      const span = document.getElementById(`${period}-period`);
      if (span) {
        span.textContent = label;
        span.setAttribute("data-date", record.date);
      }
      console.debug(
        `[StatisticsManager] displayRecord(${period}): Displaying record for ${record.date}`
      );
    } catch (error) {
      console.error(
        `[StatisticsManager] displayRecord(${period}) Error:`,
        error
      );
      ChartManager.updateChart(period, ["Erreur d'affichage"], [0], [0], []);
    }
  }

  /**
   * Formatte une date selon la période :
   * - daily : "vendredi 31 janvier 2025"
   * - weekly : "Week of January 27, 2025"
   * - monthly : "janvier 2025" (en français)
   * - yearly : "2025"
   */
  formatDate(date, period) {
    try {
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }
      switch (period) {
        case "daily":
          return date.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        case "weekly":
          // Affichage en anglais pour la semaine, par exemple "Week of January 27, 2025"
          return `Week of ${date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}`;
        case "monthly":
          return date.toLocaleString("fr-FR", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          });
        case "yearly":
          return date.getUTCFullYear().toString();
        default:
          return date.toLocaleDateString("fr-FR");
      }
    } catch (error) {
      console.error(
        `[StatisticsManager] formatDate Error for period ${period}:`,
        error
      );
      return "Date invalide";
    }
  }

  /**
   * Met à jour l'état des boutons de navigation.
   * - Si currentPeriodIndex === 0 (le plus récent), désactive le bouton "next".
   * - Si currentPeriodIndex === maxIndex (le plus ancien), désactive le bouton "prev".
   */
  updateNavigationButtons(period) {
    try {
      const nav = document.querySelector(`[data-period="${period}"]`);
      if (!nav) return;

      const prevBtn = nav.querySelector(".prev");
      const nextBtn = nav.querySelector(".next");
      const currentIndex = this.currentPeriodIndex[period];
      const maxIndex = this.cache[period].dates.length - 1;

      if (prevBtn) {
        prevBtn.disabled = currentIndex >= maxIndex;
      }
      if (nextBtn) {
        nextBtn.disabled = currentIndex <= 0;
      }
      console.debug(
        `[StatisticsManager] updateNavigationButtons(${period}): currentIndex=${currentIndex}, maxIndex=${maxIndex}, prevBtn.disabled=${prevBtn.disabled}, nextBtn.disabled=${nextBtn.disabled}`
      );
    } catch (error) {
      console.error(
        `[StatisticsManager] updateNavigationButtons(${period}) Error:`,
        error
      );
    }
  }

  setupListeners() {
    try {
      console.debug(
        "[StatisticsManager] setupListeners: Setting up navigation buttons..."
      );

      // Nettoyer les listeners existants pour éviter les doublons
      this.cleanupListeners();

      document.querySelectorAll(".period-navigation").forEach((nav) => {
        const period = nav.dataset.period;
        const prevBtn = nav.querySelector(".prev");
        const nextBtn = nav.querySelector(".next");

        if (prevBtn) {
          const prevHandler = () => {
            console.debug(
              `[StatisticsManager] setupListeners: ${period} prev button clicked.`
            );
            this.navigatePeriod(period, +1);
          };
          prevBtn.addEventListener("click", prevHandler);
          // Stocker la référence pour le nettoyage
          prevBtn._statisticsHandler = prevHandler;
        }

        if (nextBtn) {
          const nextHandler = () => {
            console.debug(
              `[StatisticsManager] setupListeners: ${period} next button clicked.`
            );
            this.navigatePeriod(period, -1);
          };
          nextBtn.addEventListener("click", nextHandler);
          // Stocker la référence pour le nettoyage
          nextBtn._statisticsHandler = nextHandler;
        }
      });

      // Ajout du listener pour le bouton de suppression de l'historique
      const deleteHistoryBtn = document.getElementById(
        "delete-all-history-btn"
      );
      if (deleteHistoryBtn) {
        // Nettoyer d'abord l'ancien listener s'il existe
        if (deleteHistoryBtn._statisticsDeleteHandler) {
          deleteHistoryBtn.removeEventListener(
            "click",
            deleteHistoryBtn._statisticsDeleteHandler
          );
        }

        const deleteHandler = () => {
          this.handleDeleteAllHistory();
        };
        deleteHistoryBtn.addEventListener("click", deleteHandler);
        // Stocker la référence pour le nettoyage
        deleteHistoryBtn._statisticsDeleteHandler = deleteHandler;

        console.debug(
          "[StatisticsManager] setupListeners: Delete history button listener added."
        );
      }
    } catch (error) {
      console.error("[StatisticsManager] setupListeners Error:", error);
    }
  }

  cleanupListeners() {
    try {
      console.debug(
        "[StatisticsManager] cleanupListeners: Cleaning up existing listeners..."
      );

      // Nettoyer les listeners de navigation
      document.querySelectorAll(".period-navigation").forEach((nav) => {
        const prevBtn = nav.querySelector(".prev");
        const nextBtn = nav.querySelector(".next");

        if (prevBtn && prevBtn._statisticsHandler) {
          prevBtn.removeEventListener("click", prevBtn._statisticsHandler);
          delete prevBtn._statisticsHandler;
        }

        if (nextBtn && nextBtn._statisticsHandler) {
          nextBtn.removeEventListener("click", nextBtn._statisticsHandler);
          delete nextBtn._statisticsHandler;
        }
      });

      // Nettoyer le listener du bouton de suppression
      const deleteHistoryBtn = document.getElementById(
        "delete-all-history-btn"
      );
      if (deleteHistoryBtn && deleteHistoryBtn._statisticsDeleteHandler) {
        deleteHistoryBtn.removeEventListener(
          "click",
          deleteHistoryBtn._statisticsDeleteHandler
        );
        delete deleteHistoryBtn._statisticsDeleteHandler;
      }
    } catch (error) {
      console.error("[StatisticsManager] cleanupListeners Error:", error);
    }
  }

  /**
   * Invalide le cache et force le rechargement des données
   */
  async refreshAllData() {
    console.debug(
      "[StatisticsManager] refreshAllData: Refreshing all periods..."
    );
    try {
      for (const period of this.periods) {
        await this.updatePeriodData(period, true);
      }
      console.debug(
        "[StatisticsManager] refreshAllData: All data refreshed successfully."
      );
    } catch (error) {
      console.error("[StatisticsManager] refreshAllData Error:", error);
    }
  }

  /**
   * Gère la suppression complète de l'historique avec confirmation
   */
  async handleDeleteAllHistory() {
    try {
      console.debug(
        "[StatisticsManager] handleDeleteAllHistory: Starting delete process..."
      );

      // Import du service de notifications
      const { default: NotificationService } = await import(
        "../../services/notifications/notificationService.js"
      );

      // Affichage du popup de confirmation
      const confirmed = await NotificationService.confirm(
        "statistics.confirm.delete_all_history",
        "statistics.buttons.confirm",
        "statistics.buttons.cancel"
      );

      if (!confirmed) {
        console.debug(
          "[StatisticsManager] handleDeleteAllHistory: User cancelled deletion."
        );
        return;
      }

      // Suppression effective
      await this.deleteAllUserHistory();
    } catch (error) {
      console.error("[StatisticsManager] handleDeleteAllHistory Error:", error);
      // Affichage d'une notification d'erreur
      try {
        const { default: NotificationService } = await import(
          "../../services/notifications/notificationService.js"
        );
        NotificationService.show("statistics.delete.error", "error");
      } catch (notifError) {
        console.error("Error showing notification:", notifError);
      }
    }
  }

  /**
   * Supprime tout l'historique de l'utilisateur
   */
  async deleteAllUserHistory() {
    try {
      console.debug(
        "[StatisticsManager] deleteAllUserHistory: Making API call..."
      );

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("/api/statistics/delete-all", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.debug(
        "[StatisticsManager] deleteAllUserHistory: API response:",
        result
      );

      // Nettoyage du cache local et réinitialisation des indices
      this.periods.forEach((period) => {
        this.cache[period].dates = [];
        this.cache[period].dataMap.clear();
        this.cache[period].lastFetch = null;
        this.currentPeriodIndex[period] = 0;
      });

      // Rechargement optimisé des données (maintenant vides)
      for (const period of this.periods) {
        await this.updatePeriodData(period);
      }

      // Affichage d'une notification de succès
      const { default: NotificationService } = await import(
        "../../services/notifications/notificationService.js"
      );
      NotificationService.show("statistics.delete.success", "success");

      console.debug(
        "[StatisticsManager] deleteAllUserHistory: History deleted successfully."
      );
    } catch (error) {
      console.error("[StatisticsManager] deleteAllUserHistory Error:", error);
      throw error;
    }
  }

  async init() {
    try {
      console.debug("[StatisticsManager] init: Starting initialization...");

      // Initialiser les composants seulement s'ils ne le sont pas déjà
      if (!this.statisticsInitialized) {
        ChartManager.init();
        this.setupListeners();
        this.statisticsInitialized = true;
        console.debug("[StatisticsManager] init: Components initialized.");
      } else {
        console.debug(
          "[StatisticsManager] init: Components already initialized, refreshing data only."
        );
      }

      // TOUJOURS rafraîchir les données à chaque appel d'init
      for (const period of this.periods) {
        console.debug(
          `[StatisticsManager] init: Fetching and updating data for period "${period}" with force refresh`
        );
        // Force refresh = true pour toujours avoir les données à jour
        await this.updatePeriodData(period, true);
      }
      console.debug("[StatisticsManager] init: Initialization complete.");
    } catch (error) {
      console.error("[StatisticsManager] init Error:", error);
      // Réinitialiser le flag en cas d'erreur
      this.statisticsInitialized = false;
    }
  }

  cleanup() {
    try {
      console.debug("[StatisticsManager] cleanup: Cleaning up...");

      // Nettoyer les listeners
      this.cleanupListeners();

      // Nettoyer le cache
      this.periods.forEach((period) => {
        this.cache[period].dates = [];
        this.cache[period].dataMap.clear();
        this.cache[period].lastFetch = null;
      });

      // Réinitialiser le flag
      this.statisticsInitialized = false;

      ChartManager.destroy();
    } catch (error) {
      console.error("[StatisticsManager] cleanup Error:", error);
    }
  }
}

const statisticsManager = new StatisticsManager();

export async function initializeStatistics() {
  console.debug(
    "[initializeStatistics] Starting initialization of statistics..."
  );
  await statisticsManager.init();
  console.debug("[initializeStatistics] Initialization complete.");
}

export function cleanupStatistics() {
  console.debug("[cleanupStatistics] Starting cleanup of statistics...");
  statisticsManager.cleanup();
  console.debug("[cleanupStatistics] Cleanup complete.");
}

export async function refreshStatisticsData() {
  console.debug("[refreshStatisticsData] Refreshing statistics data...");
  await statisticsManager.refreshAllData();
  console.debug("[refreshStatisticsData] Statistics data refreshed.");
}

export { statisticsManager };
