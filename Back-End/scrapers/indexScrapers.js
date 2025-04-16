// indexScrapers.js
const { TimeValidator, browserUtils } = require("./scraperUtils");
const scraperQueue = require("./scraperQueue");

// Imports des scrapers
const scrapeAishaMosque = require("./walsall/aishaMosqueWalsall");
const scrapeMasjidAlFarouq = require("./walsall/masjidAlfarouqWalsall");
const scrapeMasjidAbuBakrWalsall = require("./walsall/masjidAbuBakrWalsall");
const scrapeGreenLaneMasjidBham = require("./birmingham/greenLaneMasjidBham");
const scrapeCentralMosqueBham = require("./birmingham/centralMosqueBham");
const scrapeQubaIsmalicCenter = require("./birmingham/qubaIsmalicCenterBham");
const scrapeMSHUK = require("./birmingham/muslimStudentsHouseBham");
const scrapeArRahmaCentreBham = require("./birmingham/arRahmaCentreBham");
const scrapeMasjidUmarBham = require("./birmingham/masjidUmarBham");
const scrapeAmanahMasjid = require("./birmingham/amanahMasjidBham");
const scrapeSparkbrookMasjid = require("./birmingham/sparkbrookMasjidBham");
const scrapeMasjidEHamza = require("./birmingham/masjidEHamzaBham");
const scrapeMasjidSulayman = require("./birmingham/masjidSulaymanBham");
const scrapeEsaIbnMaryama = require("./birmingham/masjidEsaIbnMaryamaBham");
const scrapeHallGreenMosque = require("./birmingham/hallGreenMosqueBham");
const scrapeKingsHeathMosque = require("./birmingham/kingsHeathMosqueBham");
const scrapeBournvilleMasjid = require("./birmingham/bournvilleMasjidBham");
const scrapeMasjidAsSunnah = require("./birmingham/masjidAs-SunnahAn-NabawiyyahBham");
const scrapeMasjidEUsman = require("./walsall/masjidEUsmanWalsall");
const scrapeMasjidAlAqsaWalsall = require("./walsall/masjidAlAqsaWalsall");
const scrapeJameMasjid = require("./birmingham/jameMasjidBham");
const scrapeMasjidAnnoor = require("./birmingham/masjidAnnoorBirmingham");
const scrapeMahmudSabirMasjid = require("./birmingham/mahmudSabirMasjidBham");

// Debug logs pour vérifier les imports
//console.log('===== DEBUG: Checking imports =====');
//console.log('===== END DEBUG =====');

// Configuration des scrapers
const SCRAPER_CONFIG = {
  1: { name: "Aisha Mosque Walsall", fn: scrapeAishaMosque },
  2: { name: "Masjid Al-Farouq Walsall", fn: scrapeMasjidAlFarouq },
  3: { name: "Masjid Abu Bakr Walsall", fn: scrapeMasjidAbuBakrWalsall },
  4: { name: "Green Lane Masjid Birmingham", fn: scrapeGreenLaneMasjidBham },
  5: { name: "Central Mosque Birmingham", fn: scrapeCentralMosqueBham },
  6: { name: "Quba Islamic Center Birmingham", fn: scrapeQubaIsmalicCenter },
  7: { name: "Muslim Students House Birmingham", fn: scrapeMSHUK },
  8: { name: "Ar-Rahma Centre Birmingham", fn: scrapeArRahmaCentreBham },
  9: { name: "Masjid Umar Birmingham", fn: scrapeMasjidUmarBham },
  10: { name: "Amanah Masjid Birmingham", fn: scrapeAmanahMasjid },
  11: { name: "Sparkbrook Masjid Birmingham", fn: scrapeSparkbrookMasjid },
  12: { name: "Masjid E Hamza Birmingham", fn: scrapeMasjidEHamza },
  13: { name: "Sulayman bin Dawud Birmingham", fn: scrapeMasjidSulayman },
  14: { name: "Masjid Esa ibn Maryama Birmingham", fn: scrapeEsaIbnMaryama },
  15: { name: "Hall Green Mosque Birmingham", fn: scrapeHallGreenMosque },
  16: { name: "Kings Heath Mosque Birmingham", fn: scrapeKingsHeathMosque },
  17: {
    name: "Bournville Masjid and Community Centre Birmingham",
    fn: scrapeBournvilleMasjid,
  },
  18: {
    name: "Masjid As-Sunnah An-Nabawiyyah Birmingham",
    fn: scrapeMasjidAsSunnah,
  },
  19: { name: "Masjid-e-Usman Birmingham", fn: scrapeMasjidEUsman },
  20: { name: "Masjid Al-Aqsa Walsall", fn: scrapeMasjidAlAqsaWalsall },
  21: { name: "Jame Masjid Birmingham", fn: scrapeJameMasjid },
  22: { name: "Masjid An-noor Birmingham", fn: scrapeMasjidAnnoor },
  23: {
    name: "MahmudSabir Al Furqan Masjid Birmingham",
    fn: scrapeMahmudSabirMasjid,
  },
};

class ScraperManager {
  constructor() {
    this.retryAttempts = new Map();
    this.MAX_RETRIES = 2;
    this.scrapers = new Map();
    this.setupScrapers();
    this.activeScrapings = new Map(); // Pour suivre les scrapings en cours
  }

  setupScrapers() {
    console.log("===== DEBUG: Starting scraper setup =====");
    Object.entries(SCRAPER_CONFIG).forEach(([id, config]) => {
      console.log(`DEBUG: Setting up scraper ${id} (${config.name})`);

      // Vérifier si la fonction est correctement importée
      if (!config.fn) {
        console.error(`ERROR: Scraper function is undefined for ID ${id}`);
        return;
      }

      try {
        this.scrapers.set(
          parseInt(id),
          this.createRobustScraper(parseInt(id), config)
        );
        console.log(`DEBUG: Successfully set up scraper ${id}`);
      } catch (error) {
        console.error(`ERROR setting up scraper ${id}:`, error);
      }
    });

    console.log("===== DEBUG: Scraper setup complete =====");
  }

  createRobustScraper(id, config) {
    return async () => {
      // Si déjà en cours, attendre sans log supplémentaire
      if (scraperQueue.isProcessing(id)) {
        return await scraperQueue.getActiveTask(id);
      }

      // Log unique au démarrage du scraping
      console.log(`Scraping de ${config.name} (ID: ${id})`);

      // Utiliser la queue pour gérer le scraping
      return await scraperQueue.enqueue(id, async () => {
        const rawResult = await config.fn();

        if (!rawResult || !rawResult.times) {
          throw new Error(`Format invalide depuis ${config.name}`);
        }

        // Log de succès
        console.log(`Scraping réussi pour ${config.name}`);
        return {
          source: config.name,
          date: rawResult.date,
          times: rawResult.times,
          mosqueId: id,
          scrapedAt: new Date().toISOString(),
        };
      });
    };
  }

  async runScraper(mosqueId) {
    console.log(`Attempting to run scraper for mosque ID ${mosqueId}`);
    const scraper = this.scrapers.get(mosqueId);
    if (!scraper) {
      console.error(`No scraper found for mosque ID ${mosqueId}`);
      throw new Error(`No scraper found for mosque ID ${mosqueId}`);
    }
    return scraper();
  }

  // Optimisation de runAllScrapers pour réduire la verbosité et organiser par lots plus grands
  async runAllScrapers() {
    const startTime = Date.now();
    const results = [];
    const errors = [];
    const batchSize = 8; // Augmentation du batch pour réduire le nombre de lots

    // Récupérer tous les IDs de scrapers
    const scraperIds = Object.keys(SCRAPER_CONFIG).map((id) => parseInt(id));

    // Variable pour traquer les scrapers déjà exécutés dans cette session
    const executedScrapers = new Set();

    // Log global au début seulement
    console.log(`Démarrage du scraping pour ${scraperIds.length} mosquées...`);

    // Traiter par lots
    for (let i = 0; i < scraperIds.length; i += batchSize) {
      const batch = scraperIds.slice(i, i + batchSize);

      // Log une seule fois par lot
      console.log(
        `Traitement du lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          scraperIds.length / batchSize
        )}`
      );

      // Vérifier quels scrapers peuvent réellement être exécutés
      const scrapersToRun = batch.filter((id) => {
        // Ignorer si déjà exécuté durant cette session
        if (executedScrapers.has(id)) return false;

        // Ignorer si déjà en cours de traitement
        if (scraperQueue.isProcessing(id)) return false;

        // Ignorer si résultat récent existe déjà
        if (scraperQueue.hasRecentExecution(id)) return false;

        // Marquer comme exécuté pour cette session
        executedScrapers.add(id);
        return true;
      });

      // Exécuter seulement ceux qui n'ont pas été exécutés
      if (scrapersToRun.length > 0) {
        await Promise.allSettled(
          scrapersToRun.map((id) =>
            this.runScraper(id)
              .then((result) => {
                if (result) results.push(result);
              })
              .catch((error) => {
                errors.push({
                  mosqueId: id,
                  mosqueName: SCRAPER_CONFIG[id].name,
                  error: error.message,
                });
              })
          )
        );
      }

      // Délai plus important entre les lots pour permettre au navigateur de respirer
      if (i + batchSize < scraperIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `Scraping terminé en ${duration}ms - Résultats: ${results.length}, Erreurs: ${errors.length}`
    );

    return { results, errors, duration, timestamp: new Date().toISOString() };
  }

  getScraperStatus() {
    return {
      totalScrapers: this.scrapers.size,
      queueStatus: scraperQueue.getStatus(),
      scrapers: Object.fromEntries(
        [...this.scrapers.keys()].map((id) => [
          id,
          {
            name: SCRAPER_CONFIG[id].name,
            isProcessing: scraperQueue.isProcessing(id),
          },
        ])
      ),
    };
  }
}

// Créer et exporter une instance unique du manager
const scraperManager = new ScraperManager();

// Exporter les méthodes nécessaires
module.exports = {
  scrapers: Object.fromEntries(
    [...scraperManager.scrapers.entries()].map(([id, fn]) => [id, fn])
  ),
  runAllScrapers: () => scraperManager.runAllScrapers(),
  runScraper: (mosqueId) => scraperManager.runScraper(mosqueId),
  getScraperStatus: () => scraperManager.getScraperStatus(),
};
