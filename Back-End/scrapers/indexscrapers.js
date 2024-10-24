// indexscrapers.js

const scrapeAishaMosque = require("./walsall/aishaMosqueWalsall.js",);
const scrapeMasjidAlFarouq = require("./walsall/masjidAlfarouqWalsall.js");
const scrapeMasjidAbuBakrWalsall = require("./walsall/masjidAbuBakrWalsall.js");
const scrapeGreenLaneMasjidBham = require("./birmingham/greenLaneMasjidBham.js")
const scrapeCentraleMosqueBham = require("./birmingham/centraleMosqueBham.js")
const testScraping = require("../testScraping.js");
// Importez d'autres scrapers ici si nécessaire

const scrapers = {
  1: scrapeAishaMosque,
  2: scrapeMasjidAlFarouq,
  3: scrapeMasjidAbuBakrWalsall,
  4: scrapeGreenLaneMasjidBham,
  5: scrapeCentraleMosqueBham,

};

module.exports = { scrapers };
