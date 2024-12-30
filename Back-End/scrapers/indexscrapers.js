// indexScrapers.js
const { ScraperLock } = require('./scraperUtils');

// Import des scrapers de Walsall
const scrapeAishaMosque = require("./walsall/aishaMosqueWalsall");
const scrapeMasjidAlFarouq = require("./walsall/masjidAlfarouqWalsall");
const scrapeMasjidAbuBakrWalsall = require("./walsall/masjidAbuBakrWalsall");

// Import des scrapers de Birmingham
const scrapeGreenLaneMasjidBham = require("./birmingham/greenLaneMasjidBham");
const scrapeCentralMosqueBham = require("./birmingham/centralMosqueBham");
const scrapeQubaIsmalicCenter = require("./birmingham/qubaIsmalicCenterBham");
const scrapeMSHUK = require("./birmingham/muslumStudentsHouseBham");


// Création des wrappers de scraping avec gestion des verrous
const createScraper = (scraperId, scraperFunction) => {
  return async () => {
    try {
      if (!(await ScraperLock.acquireLock(scraperId))) {
        return null;
      }
      return await scraperFunction();
    } finally {
      ScraperLock.releaseLock(scraperId);
    }
  };
};

// Mapping des scrapers avec leurs IDs
const scrapers = {
  1: createScraper(1, scrapeAishaMosque),
  2: createScraper(2, scrapeMasjidAlFarouq),
  3: createScraper(3, scrapeMasjidAbuBakrWalsall),
  4: createScraper(4, scrapeGreenLaneMasjidBham),
  5: createScraper(5, scrapeCentralMosqueBham),
  6: createScraper(6, scrapeQubaIsmalicCenter),
  7: createScraper(7, scrapeMSHUK)
};

module.exports = { scrapers };