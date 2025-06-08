/**
 * indexScrapers.js - Point d'entrée principal CORRIGÉ
 *
 * ✅ CORRECTIONS APPLIQUÉES :
 * 1. Résumé généré APRÈS que tous les scrapers soient terminés
 * 2. Monitoring qui s'adapte automatiquement aux nouvelles mosquées
 * 3. Mapping dynamique au lieu de statique
 */

const { TimeValidator, browserUtils } = require("./utils/scraper");
const scraperQueue = require("./queue");
const { monitoring } = require("./utils/monitoring");
const { createLogger } = require("./utils/logger");
const scrapingEventEmitter = require("./utils/scrapingEventEmitter");

// Logger principal
const logger = createLogger("ScraperManager");

// Lazy loading des scrapers par pays
let countryScrapers = null;
const getCountryScrapers = () => {
  if (!countryScrapers) {
    countryScrapers = require("./countries");
    logger.debug("🔧 Chargement lazy des scrapers par pays");
  }
  return countryScrapers;
};

// Configuration automatique des scrapers depuis la structure par pays/villes
class ScraperManager {
  constructor() {
    this.retryAttempts = new Map();
    this.MAX_RETRIES = 3;
    this.scrapers = new Map();
    this.activeScrapings = new Map(); // Pour suivre les scrapings en cours

    // ✅ CORRECTION 2: Mapping dynamique au lieu de statique
    this.setupScrapersWithDynamicMapping();

    logger.info("🚀 ScraperManager initialisé avec optimisations avancées");
  }

  // ✅ NOUVELLE MÉTHODE: Configuration dynamique qui s'adapte automatiquement
  setupScrapersWithDynamicMapping() {
    logger.info(
      "===== Configuration DYNAMIQUE du mapping DB ID → Scrapers ====="
    );

    // Import des scrapers par structure hiérarchique
    const countryScrapersModule = getCountryScrapers();
    const allScrapers = countryScrapersModule.getAllScrapersFlat();

    // ✅ CORRECTION 2: Mapping dynamique basé sur la découverte automatique
    // Chaque scraper découvert automatiquement reçoit un ID séquentiel
    const dynamicMapping = {};
    let currentId = 1;

    // Pour maintenir la compatibilité avec l'ancien système,
    // on peut garder un mapping de base pour les mosquées existantes
    const legacyMapping = {
      // ✅ MOSQUÉES DE WALSALL (5 mosquées - IDs 1, 2, 3, 19, 20)
      aishaMosque: 1,
      masjidAbuBakr: 2, // Walsall
      masjidAlAqsa: 3,
      masjidAlfarouq: 19,
      masjidEUsman: 20,

      // ✅ MOSQUÉES DE BIRMINGHAM (19 mosquées - IDs 4-18, 21-24)
      amanahMasjid: 4,
      arRahmaCentre: 5,
      bournvilleMasjid: 6,
      centralMosque: 7,
      greenLaneMasjid: 8,
      hallGreenMosque: 9,
      jameMasjid: 10,
      sparkbrookMasjid: 11,
      mahmudSabirMasjid: 12,
      masjidAnnoor: 13,
      masjidAsSunnahAnNabawiyyah: 14,
      masjidEHamza: 15,
      masjidEsaIbnMaryama: 16,
      masjidSulayman: 17,
      kingsHeathMosque: 18,
      masjidUmar: 21,
      muslimStudentsHouse: 22,
      qubaIsmalicCenter: 23,
      masjidAbuBakrBham: 24,
    };

    // Mapper d'abord les mosquées connues
    allScrapers.forEach((scraperData) => {
      const legacyId = legacyMapping[scraperData.key];
      if (legacyId) {
        dynamicMapping[legacyId] = scraperData.key;
      }
    });

    // ✅ PUIS ajouter automatiquement les nouvelles mosquées avec des IDs séquentiels
    let nextAvailableId =
      Math.max(...Object.keys(legacyMapping).map((k) => legacyMapping[k])) + 1;

    allScrapers.forEach((scraperData) => {
      const isAlreadyMapped = Object.values(dynamicMapping).includes(
        scraperData.key
      );
      if (!isAlreadyMapped) {
        dynamicMapping[nextAvailableId] = scraperData.key;
        logger.info(
          `🆕 Nouvelle mosquée ajoutée: ID ${nextAvailableId} → ${scraperData.name}`
        );
        nextAvailableId++;
      }
    });

    // Configuration automatique avec mapping dynamique
    for (const [dbId, scraperKey] of Object.entries(dynamicMapping)) {
      const scraperData = allScrapers.find((s) => s.key === scraperKey);
      if (scraperData) {
        this.scrapers.set(
          parseInt(dbId),
          this.createRobustScraper(parseInt(dbId), {
            name: scraperData.name,
            fn: scraperData.fn,
          })
        );
      } else {
        logger.error(
          `❌ Scraper '${scraperKey}' non trouvé pour DB ID ${dbId}`
        );
      }
    }

    // ✅ CORRECTION 2: Log dynamique du nombre total
    const totalMosques = this.scrapers.size;
    logger.info(
      `===== ${totalMosques} scrapers configurés avec mapping DYNAMIQUE =====`
    );
    logger.info(
      `📊 Répartition: ${totalMosques} mosquées configurées (auto-découvertes)`
    );

    // Log des nouvelles mosquées si il y en a
    if (totalMosques > 24) {
      logger.info(
        `🎉 ${
          totalMosques - 24
        } nouvelle(s) mosquée(s) ajoutée(s) automatiquement !`
      );
    }
  }

  createRobustScraper(id, config) {
    return async () => {
      // Si déjà en cours, attendre sans log supplémentaire
      if (scraperQueue.isProcessing(id)) {
        return await scraperQueue.getActiveTask(id);
      }

      // Émettre l'événement de démarrage
      scrapingEventEmitter.emitScraperStarted(id, config.name);
      logger.scraping.start(config.name, id);

      // Préparer les informations de mosquée pour le fallback
      const mosqueInfo = {
        id: id,
        name: config.name,
        city: this.getCityFromId(id),
        country: "uk",
      };

      try {
        const result = await scraperQueue.enqueue(
          id,
          async () => {
            // Correction: appeler directement la fonction exportée
            const rawResult = await config.fn();

            if (!rawResult || !rawResult.times) {
              throw new Error(`Format invalide depuis ${config.name}`);
            }

            // Log de succès
            logger.scraping.success(config.name, Date.now() - Date.now());
            return {
              source: config.name,
              date: rawResult.date,
              times: rawResult.times,
              mosqueId: id,
              scrapedAt: new Date().toISOString(),
              city: mosqueInfo.city,
              country: mosqueInfo.country,
            };
          },
          mosqueInfo
        ); // Passer mosqueInfo pour le fallback

        // Émettre l'événement de completion (succès)
        scrapingEventEmitter.emitScraperCompleted(id, config.name, result);
        return result;
      } catch (error) {
        // Émettre l'événement de completion (erreur)
        scrapingEventEmitter.emitScraperFailed(id, config.name, error);
        throw error;
      }
    };
  }

  // Déterminer la ville en fonction de l'ID de mosquée (version corrigée)
  getCityFromId(mosqueId) {
    // ✅ CORRECTION: Mapping corrigé selon la vraie répartition
    // Mosquées de Walsall: IDs 1, 2, 3, 19, 20
    if ([1, 2, 3, 19, 20].includes(mosqueId)) {
      return "walsall";
    }
    // Mosquées de Birmingham: IDs 4-18, 21-24
    else if (
      (mosqueId >= 4 && mosqueId <= 18) ||
      (mosqueId >= 21 && mosqueId <= 24)
    ) {
      return "birmingham";
    }

    // ✅ Pour les nouvelles mosquées (ID > 24), détecter dynamiquement
    if (mosqueId > 24) {
      // Récupérer la ville depuis les métadonnées du scraper
      const countryScrapersModule = getCountryScrapers();
      const allScrapers = countryScrapersModule.getAllScrapersFlat();
      const scraperData = allScrapers[mosqueId - 1]; // Approximation basée sur l'ordre
      return scraperData ? scraperData.city.toLowerCase() : "unknown";
    }

    return "unknown";
  }

  // Méthode pour obtenir le nom d'une mosquée par ID (version dynamique)
  getMosqueName(mosqueId) {
    const countryScrapersModule = getCountryScrapers();
    const allScrapers = countryScrapersModule.getAllScrapersFlat();

    // ✅ CORRECTION 2: Chercher dynamiquement au lieu d'un mapping statique
    // Approximation : l'ordre des scrapers correspond grosso modo aux IDs
    if (mosqueId <= allScrapers.length) {
      const scraperData = allScrapers[mosqueId - 1];
      return scraperData ? scraperData.name : `Mosquée ID ${mosqueId}`;
    }

    return `Mosquée ID ${mosqueId}`;
  }

  // Obtenir la taille de lot optimale selon la charge système
  getOptimalBatchSize() {
    const os = require("os");
    const freeMemory = os.freemem();
    const totalMemory = os.totalmem();
    const memoryUsage = (totalMemory - freeMemory) / totalMemory;

    if (memoryUsage < 0.5) return 12; // Système libre
    if (memoryUsage < 0.7) return 8; // Charge normale
    return 4; // Système chargé
  }

  async runScraper(mosqueId) {
    logger.debug(
      `Tentative d'exécution du scraper pour la mosquée ID ${mosqueId}`
    );

    // Démarrer le monitoring
    const execution = monitoring.startExecution(mosqueId);

    try {
      const scraper = this.scrapers.get(mosqueId);
      if (!scraper) {
        const error = new Error(
          `Aucun scraper trouvé pour la mosquée ID ${mosqueId}`
        );
        monitoring.recordFailure(execution, error);
        logger.error(error.message);
        throw error;
      }

      // Exécuter le scraper
      const result = await scraper();

      // Enregistrer le succès
      monitoring.recordSuccess(execution, result);

      return result;
    } catch (error) {
      // Enregistrer l'échec
      monitoring.recordFailure(execution, error);
      throw error;
    }
  }

  // ✅ CORRECTION 1: Version CORRIGÉE qui attend TOUS les scrapers
  async runAllScrapers() {
    const startTime = Date.now();
    const results = [];
    const errors = [];
    const batchSize = this.getOptimalBatchSize();

    // Récupérer tous les IDs de scrapers configurés
    const scraperIds = Array.from(this.scrapers.keys());

    // Variable pour traquer les scrapers déjà exécutés dans cette session
    const executedScrapers = new Set();
    let actualMosquesToProcess = 0;

    // Émettre l'événement de démarrage du scraping global
    scrapingEventEmitter.emitGlobalScrapingStarted(scraperIds.length);

    // Log global au début seulement
    logger.performance.globalComplete(scraperIds.length, 0, 0, 0); // Log de démarrage
    logger.info(
      `🚀 Démarrage scraping optimisé: ${scraperIds.length} mosquées (lots de ${batchSize})`
    );

    // ✅ CORRECTION 1: Collecter TOUTES les promesses sans les attendre individuellement
    const allScraperPromises = [];

    // Traiter par lots adaptatifs
    const totalBatches = Math.ceil(scraperIds.length / batchSize);

    for (let i = 0; i < scraperIds.length; i += batchSize) {
      const batch = scraperIds.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      // Vérifier quels scrapers peuvent réellement être exécutés
      const scrapersToRun = batch.filter((id) => {
        if (executedScrapers.has(id)) return false;
        if (scraperQueue.isProcessing(id)) return false;
        if (scraperQueue.hasRecentExecution(id)) return false;

        executedScrapers.add(id);
        return true;
      });

      actualMosquesToProcess += scrapersToRun.length;

      if (scrapersToRun.length > 0) {
        logger.performance.batchStart(
          batchNumber,
          totalBatches,
          scrapersToRun.length
        );

        // ✅ CORRECTION 1: Ajouter les promesses à la liste globale au lieu de les attendre
        const batchPromises = scrapersToRun.map((id) =>
          this.runScraper(id)
            .then((result) => {
              if (result) {
                results.push(result);
                return { type: "success", result, mosqueId: id };
              }
            })
            .catch((error) => {
              const errorObj = {
                mosqueId: id,
                mosqueName: this.getMosqueName(id),
                error: error.message,
              };
              errors.push(errorObj);
              return { type: "error", error: errorObj, mosqueId: id };
            })
        );

        // Ajouter les promesses du lot à la liste globale
        allScraperPromises.push(...batchPromises);

        // Log immédiat du lot (sans attendre les résultats)
        logger.performance.batchComplete(
          batchNumber,
          scrapersToRun.length,
          0,
          0
        );
      }

      // Pause courte entre chaque lot
      if (i + batchSize < scraperIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // ✅ CORRECTION 1: MAINTENANT attendre que TOUS les scrapers soient terminés
    logger.info(
      `⏳ Attente de la fin de tous les ${allScraperPromises.length} scrapers...`
    );

    await Promise.allSettled(allScraperPromises);

    // ✅ CORRECTION CRITIQUE: Attendre que la queue soit réellement vide
    logger.info(`⏳ Attente que la queue soit complètement vide...`);
    await scraperQueue.waitForAll();

    // ✅ CORRECTION CRITIQUE: Attendre un délai supplémentaire pour les scrapers asynchrones
    logger.info(`⏳ Délai de sécurité pour les scrapers asynchrones...`);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // ✅ CORRECTION CRITIQUE: Vérifier qu'aucun scraper n'est encore actif
    let maxWaitAttempts = 10;
    while (scraperQueue.getStatus().active > 0 && maxWaitAttempts > 0) {
      logger.info(
        `⏳ Attente de ${scraperQueue.getStatus().active} scrapers restants...`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      maxWaitAttempts--;
    }

    if (scraperQueue.getStatus().active > 0) {
      logger.warn(
        `⚠️ ${
          scraperQueue.getStatus().active
        } scrapers encore actifs après attente maximale`
      );
    }

    // ✅ NOUVELLE CORRECTION: Vider le cache API avant d'émettre l'événement
    console.log(
      "🧹 Vidage du cache API pour forcer le rechargement des nouvelles données..."
    );
    try {
      // Vider le cache des requêtes pendantes pour forcer la récupération des nouvelles données
      if (
        global.mosqueTimesController &&
        global.mosqueTimesController.pendingRequests
      ) {
        global.mosqueTimesController.pendingRequests.clear();
        console.log("✅ Cache API vidé avec succès");
      }
    } catch (error) {
      console.warn("⚠️ Impossible de vider le cache API:", error.message);
    }

    // Émettre l'événement de completion du scraping global
    scrapingEventEmitter.emitGlobalScrapingCompleted(results, errors);

    // ✅ CORRECTION 1: Maintenant générer le résumé final (après que tout soit terminé)
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    const skippedMosques = scraperIds.length - actualMosquesToProcess;

    logger.performance.globalComplete(
      actualMosquesToProcess,
      results.length,
      errors.length,
      executionTime
    );

    if (skippedMosques > 0) {
      logger.info(
        `ℹ️  ${skippedMosques} mosquée(s) ignorée(s) (cache récent ou en cours de traitement)`
      );
    }

    // Grouper par ville pour les logs détaillés
    const resultsByCity = {};
    const errorsByCity = {};

    results.forEach((result) => {
      const city = this.getCityFromId(result.mosqueId);
      const cityName =
        city === "walsall"
          ? "Walsall"
          : city === "birmingham"
          ? "Birmingham"
          : city.charAt(0).toUpperCase() + city.slice(1); // ✅ Support dynamique

      if (!resultsByCity[cityName]) {
        resultsByCity[cityName] = [];
      }
      resultsByCity[cityName].push(result);
    });

    errors.forEach((error) => {
      const city = this.getCityFromId(error.mosqueId);
      const cityName =
        city === "walsall"
          ? "Walsall"
          : city === "birmingham"
          ? "Birmingham"
          : city.charAt(0).toUpperCase() + city.slice(1); // ✅ Support dynamique

      if (!errorsByCity[cityName]) {
        errorsByCity[cityName] = [];
      }
      errorsByCity[cityName].push(error);
    });

    // Log détaillé par ville
    const allCities = new Set([
      ...Object.keys(resultsByCity),
      ...Object.keys(errorsByCity),
    ]);
    allCities.forEach((city) => {
      const cityResults = resultsByCity[city] || [];
      const cityErrors = errorsByCity[city] || [];
      const totalForCity = cityResults.length + cityErrors.length;

      if (totalForCity > 0) {
        logger.info(
          `✅ ${city}: ${cityResults.length} succès, ${cityErrors.length} erreurs sur ${totalForCity} mosquées`
        );
      }
    });

    // ✅ CORRECTION 1: Générer le rapport APRÈS que tout soit terminé
    const monitoringReport = monitoring.generateRunAllScrapersReport({
      results,
      errors,
    });

    // Log des statistiques finales du pool
    scraperQueue.logPerformanceStats();

    return {
      results,
      errors,
      executionTime,
      resultsByCity,
      errorsByCity,
      completed: true,
      monitoringReport,
      optimizations: {
        batchSize: batchSize,
        totalBatches: totalBatches,
        poolOptimized: true,
        dynamicMapping: true, // ✅ Nouvelle fonctionnalité
      },
    };
  }
}

// Instance par défaut pour la rétrocompatibilité
const defaultScraperManager = new ScraperManager();

// Export complet pour la rétrocompatibilité et la flexibilité
module.exports = {
  ScraperManager,
  // Getter dynamique pour exposer les scrapers
  get scrapers() {
    const scrapersObject = {};
    for (const [id, scraper] of defaultScraperManager.scrapers.entries()) {
      scrapersObject[id] = scraper;
    }
    return scrapersObject;
  },
  // Instance par défaut - rétrocompatibilité avec l'ancien système
  runScraper: defaultScraperManager.runScraper.bind(defaultScraperManager),
  runAllScrapers: defaultScraperManager.runAllScrapers.bind(
    defaultScraperManager
  ),
  // Export aussi l'instance directement pour ceux qui en ont besoin
  default: defaultScraperManager,
  // Propriétés spécifiques nécessaires pour la rétrocompatibilité
  retryAttempts: defaultScraperManager.retryAttempts,
  MAX_RETRIES: defaultScraperManager.MAX_RETRIES,
  activeScrapings: defaultScraperManager.activeScrapings,
};
