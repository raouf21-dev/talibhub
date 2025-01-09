// indexScrapers.js
const { TimeValidator, browserUtils } = require('./scraperUtils');
const scraperQueue = require('./scraperQueue');

// Imports des scrapers
const scrapeAishaMosque = require("./walsall/aishaMosqueWalsall");
const scrapeMasjidAlFarouq = require("./walsall/masjidAlfarouqWalsall");
const scrapeMasjidAbuBakrWalsall = require("./walsall/masjidAbuBakrWalsall");
const scrapeGreenLaneMasjidBham = require("./birmingham/greenLaneMasjidBham");
const scrapeCentralMosqueBham = require("./birmingham/centralMosqueBham");
const scrapeQubaIsmalicCenter = require("./birmingham/qubaIsmalicCenterBham");
const scrapeMSHUK = require("./birmingham/muslimStudentsHouseBham");
const scrapeArRahmaCentreBham = require("./birmingham/arRahmaCentreBham");

// Debug logs pour vérifier les imports
console.log('===== DEBUG: Checking imports =====');
console.log('arRahmaCentreBham:', typeof scrapeArRahmaCentreBham);
console.log('centralMosqueBham:', typeof scrapeCentralMosqueBham);
console.log('===== END DEBUG =====');

// Configuration des scrapers
const SCRAPER_CONFIG = {
    1: { name: 'Aisha Mosque Walsall', fn: scrapeAishaMosque },
    2: { name: 'Masjid Al-Farouq Walsall', fn: scrapeMasjidAlFarouq },
    3: { name: 'Masjid Abu Bakr Walsall', fn: scrapeMasjidAbuBakrWalsall },
    4: { name: 'Green Lane Masjid Birmingham', fn: scrapeGreenLaneMasjidBham },
    5: { name: 'Central Mosque Birmingham', fn: scrapeCentralMosqueBham },
    6: { name: 'Quba Islamic Center Birmingham', fn: scrapeQubaIsmalicCenter },
    7: { name: 'Muslim Students House Birmingham', fn: scrapeMSHUK },
    8: { name: 'Ar-Rahma Centre Birmingham', fn: scrapeArRahmaCentreBham }
};

class ScraperManager {
    constructor() {
        this.retryAttempts = new Map();
        this.MAX_RETRIES = 2;
        this.scrapers = new Map();
        this.setupScrapers();
    }

    setupScrapers() {
        console.log('===== DEBUG: Starting scraper setup =====');
        Object.entries(SCRAPER_CONFIG).forEach(([id, config]) => {
            console.log(`DEBUG: Setting up scraper ${id} (${config.name})`);
            console.log(`DEBUG: Scraper function type:`, typeof config.fn);
            
            // Vérifier si la fonction est correctement importée
            if (!config.fn) {
                console.error(`ERROR: Scraper function is undefined for ID ${id}`);
                return;
            }
    
            try {
                this.scrapers.set(parseInt(id), this.createRobustScraper(parseInt(id), config));
                console.log(`DEBUG: Successfully set up scraper ${id}`);
            } catch (error) {
                console.error(`ERROR setting up scraper ${id}:`, error);
            }
        });
    
        console.log('DEBUG: Current scrapers map:', [...this.scrapers.keys()]);
        console.log('===== DEBUG: Scraper setup complete =====');
    }

    createRobustScraper(id, config) {
        console.log(`DEBUG: Creating robust scraper for ID ${id}`);
        return async () => {
            const startTime = Date.now();
            
            try {
                // Si déjà en cours de scraping, attendre le résultat
                if (scraperQueue.isProcessing(id)) {
                    console.log(`DEBUG: Scraper ${id} is already running, waiting for result...`);
                    return await scraperQueue.getActiveTask(id);
                }
    
                console.log(`DEBUG: Starting new scrape for ${config.name} (ID: ${id})`);

                // Utiliser la queue pour gérer le scraping
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
        console.log(`Attempting to run scraper for mosque ID ${mosqueId}`);
        const scraper = this.scrapers.get(mosqueId);
        if (!scraper) {
            console.error(`No scraper found for mosque ID ${mosqueId}. Available scrapers:`, 
                Array.from(this.scrapers.keys()));
            throw new Error(`No scraper found for mosque ID ${mosqueId}`);
        }
        console.log(`Found scraper for mosque ID ${mosqueId}, executing...`);
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
            scrapers: Object.fromEntries([...this.scrapers.keys()].map(id => [
                id,
                {
                    name: SCRAPER_CONFIG[id].name,
                    isProcessing: scraperQueue.isProcessing(id)
                }
            ]))
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
    getScraperStatus: () => scraperManager.getScraperStatus()
};