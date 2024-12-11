// indexscrapers.js

const scrapeAishaMosque = require("./walsall/aishaMosqueWalsall.js",);
const scrapeMasjidAlFarouq = require("./walsall/masjidAlfarouqWalsall.js");
const scrapeMasjidAbuBakrWalsall = require("./walsall/masjidAbuBakrWalsall.js");
const scrapeGreenLaneMasjidBham = require("./birmingham/greenLaneMasjidBham.js")
const scrapeCentralMosqueBham = require("./birmingham/centralMosqueBham.js")
const scrapeQubaIsmalicCenter = require("./birmingham/qubaIsmalicCenterBham.js")
const scrapeMSHUK = require("./birmingham/muslumStudentsHouseBham.js")
const testScraping = require("../testScraping.js");
// Importez d'autres scrapers ici si nécessaire

const scrapers = {
  1: scrapeAishaMosque,
  2: scrapeMasjidAlFarouq,
  3: scrapeMasjidAbuBakrWalsall,
  4: scrapeGreenLaneMasjidBham,
  5: scrapeCentralMosqueBham,
  6: scrapeQubaIsmalicCenter,
  7: scrapeMSHUK

};

module.exports = { scrapers };
