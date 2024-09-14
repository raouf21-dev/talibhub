// Back-End/scrapers/indexscrapers.js

const scrapeAishaMosque = require("./Walsall/aishamosque.js");
const testScraping = require("../testScraping.js");
// Importez d'autres scrapers ici si nécessaire

const scrapers = {
  1: scrapeAishaMosque,
  2: testScraping,
  // Ajoutez d'autres scrapers avec leurs IDs correspondants
};

module.exports = {
  scrapers,
  testScraping,
};
