// indexscrapers.js

const scrapeAishaMosque = require("./walsall/aishaMosqueWalsall.js",);
const scrapeMasjidAlFarouq = require("./walsall/masjidAlfarouqWalsall.js");
const scrapeMasjidAbuBakrWalsall = require("./walsall/masjidAbuBakrWalsall.js");
const testScraping = require("../testScraping.js");
// Importez d'autres scrapers ici si nécessaire

const scrapers = {
  1: scrapeAishaMosque,
  2: scrapeMasjidAlFarouq,
  3: scrapeMasjidAbuBakrWalsall,
  // Ajoutez d'autres scrapers avec leurs IDs correspondants
};

module.exports = { scrapers };
