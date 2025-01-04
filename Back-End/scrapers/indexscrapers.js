// indexscrapers.js
const { TimeValidator, browserUtils } = require('./scraperUtils');
const scraperQueue = require('./scraperQueue');

// Import des scrapers
const scrapeAishaMosque = require("./walsall/aishaMosqueWalsall");
const scrapeMasjidAlFarouq = require("./walsall/masjidAlfarouqWalsall");
const scrapeMasjidAbuBakrWalsall = require("./walsall/masjidAbuBakrWalsall");
const scrapeGreenLaneMasjidBham = require("./birmingham/greenLaneMasjidBham");
const scrapeCentralMosqueBham = require("./birmingham/centralMosqueBham");
const scrapeQubaIsmalicCenter = require("./birmingham/qubaIsmalicCenterBham");
const scrapeMSHUK = require("./birmingham/muslimStudentsHouseBham");
const scrapeArRahmaCentreBham = require("./birmingham/arRahmaCentreBham.js");

// Configuration des scrapers
const SCRAPER_CONFIG = {
    1: { name: 'Aisha Mosque Walsall', fn: scrapeAishaMosque },
    2: { name: 'Masjid Al-Farouq Walsall', fn: scrapeMasjidAlFarouq },
    3: { name: 'Masjid Abu Bakr Walsall', fn: scrapeMasjidAbuBakrWalsall },
    4: { name: 'Green Lane Masjid Birmingham', fn: scrapeGreenLaneMasjidBham },
    5: { name: 'Central Mosque Birmingham', fn: scrapeCentralMosqueBham },
    6: { name: 'Quba Islamic Center Birmingham', fn: scrapeQubaIsmalicCenter },
    7: { name: 'Muslim Students House Birmingham', fn: scrapeMSHUK },
    8: { name: 'Ar-Rahma Centre Birmingham', fn: scrapeArRahmaCentreBham },
};

class ScraperManager {
  constructor() {
      this.retryAttempts = new Map();
      this.MAX_RETRIES = 2;
      this.scrapers = new Map();
      this.setupScrapers();
  }

  setupScrapers() {
      Object.entries(SCRAPER_CONFIG).forEach(([id, config]) => {
          this.scrapers.set(parseInt(id), this.createRobustScraper(parseInt(id), config));
      });
  }

  createRobustScraper(id, config) {
    return async () => {
        const startTime = Date.now();
        
        try {
            // Si déjà en cours de scraping, utiliser le résultat existant
            if (scraperQueue.isProcessing(id)) {
                console.log(`Scraper ${id} is already running, waiting for result...`);
                await scraperQueue.waitForAll();
                return;
            }

            console.log(`Starting scraping for ${config.name} (ID: ${id})`);

            const result = await scraperQueue.enqueue(id, async () => {
                const rawResult = await config.fn();
                
                if (!rawResult || !rawResult.times) {
                    throw new Error(`Invalid result format from ${config.name}`);
                }

                return {
                    source: config.name,
                    date: rawResult.date,
                    times: rawResult.times,
                    mosqueId: id,
                    scrapedAt: new Date().toISOString()
                };
            });

            const duration = Date.now() - startTime;
            console.log(`Successfully scraped ${config.name} in ${duration}ms`);
            
            return result;

        } catch (error) {
            console.error(`Error scraping ${config.name}:`, error);
            return null;
        }
    };
}

  async runScraper(mosqueId) {
      const scraper = this.scrapers.get(mosqueId);
      if (!scraper) {
          throw new Error(`No scraper found for mosque ID ${mosqueId}`);
      }
      return scraper();
  }

  async runAllScrapers() {
    const startTime = Date.now();
    const results = [];
    const errors = [];

    // Exécuter les scrapers séquentiellement
    for (const [id, config] of Object.entries(SCRAPER_CONFIG)) {
        try {
            const result = await this.runScraper(parseInt(id));
            if (result) results.push(result);
            
            // Petit délai entre les scrapers pour éviter la surcharge
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            errors.push({
                mosqueId: id,
                mosqueName: config.name,
                error: error.message
            });
        }
    }

    // Attendre que toutes les tâches soient terminées
    await scraperQueue.waitForAll();

    const duration = Date.now() - startTime;
    console.log(`All scrapers completed in ${duration}ms`);

    return {
        results,
        errors,
        duration,
        timestamp: new Date().toISOString()
    };
}

  getScraperStatus() {
      return {
          totalScrapers: this.scrapers.size,
          queueStatus: scraperQueue.getStatus(),
          retryAttempts: Object.fromEntries(this.retryAttempts),
          scrapers: Object.fromEntries([...this.scrapers.keys()].map(id => [
              id,
              {
                  name: SCRAPER_CONFIG[id].name,
                  isRetrying: this.retryAttempts.has(id),
                  retryCount: this.retryAttempts.get(id) || 0
              }
          ]))
      };
  }
}

// Créer et exporter une instance unique du gestionnaire de scrapers
const scraperManager = new ScraperManager();

// Function aliases pour la compatibilité avec l'ancien code
const scrapers = Object.fromEntries(
  [...scraperManager.scrapers.entries()].map(([id, fn]) => [id, fn])
);

module.exports = {
  scrapers,
  scraperManager,
  runAllScrapers: () => scraperManager.runAllScrapers(),
  runScraper: (mosqueId) => scraperManager.runScraper(mosqueId),
  getScraperStatus: () => scraperManager.getScraperStatus()
};