const EventEmitter = require("events");

/**
 * Système d'événements centralisé pour le scraping des mosquées
 * Permet la communication entre les scrapers et les composants frontend
 */
class ScrapingEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.scrapingStatus = new Map(); // Statut de chaque scraper
    this.globalScrapingStatus = {
      isRunning: false,
      startTime: null,
      totalScrapers: 0,
      completedScrapers: 0,
      failedScrapers: 0,
      results: [],
      errors: [],
    };

    console.log("📡 [ScrapingEventEmitter] Système d'événements initialisé");
  }

  /**
   * Émettre l'événement de démarrage d'un scraper individuel
   */
  emitScraperStarted(mosqueId, mosqueName) {
    const eventData = {
      mosqueId,
      mosqueName,
      timestamp: new Date().toISOString(),
      status: "started",
    };

    this.scrapingStatus.set(mosqueId, eventData);
    this.emit("scraperStarted", eventData);

    console.log(
      `🔄 [ScrapingEventEmitter] Scraper démarré: ${mosqueName} (ID: ${mosqueId})`
    );
  }

  /**
   * Émettre l'événement de completion d'un scraper individuel (succès)
   */
  emitScraperCompleted(mosqueId, mosqueName, result) {
    const eventData = {
      mosqueId,
      mosqueName,
      timestamp: new Date().toISOString(),
      status: "completed",
      result,
      success: true,
    };

    this.scrapingStatus.set(mosqueId, eventData);
    this.emit("scraperCompleted", eventData);
    this.emit("scraperFinished", eventData); // Événement générique de fin

    console.log(
      `✅ [ScrapingEventEmitter] Scraper terminé avec succès: ${mosqueName} (ID: ${mosqueId})`
    );
  }

  /**
   * Émettre l'événement de completion d'un scraper individuel (erreur)
   */
  emitScraperFailed(mosqueId, mosqueName, error) {
    const eventData = {
      mosqueId,
      mosqueName,
      timestamp: new Date().toISOString(),
      status: "failed",
      error: error.message || error,
      success: false,
    };

    this.scrapingStatus.set(mosqueId, eventData);
    this.emit("scraperFailed", eventData);
    this.emit("scraperFinished", eventData); // Événement générique de fin

    console.log(
      `❌ [ScrapingEventEmitter] Scraper échoué: ${mosqueName} (ID: ${mosqueId}) - ${
        error.message || error
      }`
    );
  }

  /**
   * Émettre l'événement de démarrage du scraping global
   */
  emitGlobalScrapingStarted(totalScrapers) {
    this.globalScrapingStatus = {
      isRunning: true,
      startTime: new Date().toISOString(),
      totalScrapers,
      completedScrapers: 0,
      failedScrapers: 0,
      results: [],
      errors: [],
    };

    const eventData = {
      timestamp: this.globalScrapingStatus.startTime,
      totalScrapers,
      status: "started",
    };

    this.emit("globalScrapingStarted", eventData);
    console.log(
      `🚀 [ScrapingEventEmitter] Scraping global démarré: ${totalScrapers} scrapers`
    );
  }

  /**
   * Émettre l'événement de progression du scraping global
   */
  emitGlobalScrapingProgress(completed, failed, total) {
    this.globalScrapingStatus.completedScrapers = completed;
    this.globalScrapingStatus.failedScrapers = failed;

    const eventData = {
      timestamp: new Date().toISOString(),
      completed,
      failed,
      total,
      percentage: Math.round(((completed + failed) / total) * 100),
      status: "progress",
    };

    this.emit("globalScrapingProgress", eventData);
    console.log(
      `📊 [ScrapingEventEmitter] Progression: ${completed + failed}/${total} (${
        eventData.percentage
      }%)`
    );
  }

  /**
   * Émettre l'événement de completion du scraping global
   */
  emitGlobalScrapingCompleted(results, errors) {
    this.globalScrapingStatus.isRunning = false;
    this.globalScrapingStatus.results = results;
    this.globalScrapingStatus.errors = errors;
    this.globalScrapingStatus.completedScrapers = results.length;
    this.globalScrapingStatus.failedScrapers = errors.length;

    const duration =
      Date.now() - new Date(this.globalScrapingStatus.startTime).getTime();

    const eventData = {
      timestamp: new Date().toISOString(),
      startTime: this.globalScrapingStatus.startTime,
      duration,
      totalScrapers: this.globalScrapingStatus.totalScrapers,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
      status: "completed",
    };

    this.emit("globalScrapingCompleted", eventData);
    console.log(
      `🎉 [ScrapingEventEmitter] Scraping global terminé: ${results.length} succès, ${errors.length} erreurs`
    );
  }

  /**
   * Obtenir le statut actuel d'un scraper
   */
  getScraperStatus(mosqueId) {
    return this.scrapingStatus.get(mosqueId) || null;
  }

  /**
   * Obtenir le statut global du scraping
   */
  getGlobalScrapingStatus() {
    return { ...this.globalScrapingStatus };
  }

  /**
   * Vérifier si un scraping global est en cours
   */
  isGlobalScrapingInProgress() {
    return this.globalScrapingStatus.isRunning;
  }

  /**
   * Réinitialiser le statut global
   */
  resetGlobalStatus() {
    this.globalScrapingStatus = {
      isRunning: false,
      startTime: null,
      totalScrapers: 0,
      completedScrapers: 0,
      failedScrapers: 0,
      results: [],
      errors: [],
    };
    this.scrapingStatus.clear();
    console.log("🔄 [ScrapingEventEmitter] Statut global réinitialisé");
  }

  /**
   * Obtenir un résumé des événements récents
   */
  getRecentEvents(limit = 10) {
    const events = Array.from(this.scrapingStatus.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return events;
  }
}

// Instance singleton
const scrapingEventEmitter = new ScrapingEventEmitter();

module.exports = scrapingEventEmitter;
