/**
 * Index des scrapers organisés par pays
 * Ce fichier exporte tous les scrapers disponibles par pays
 */

const ukScrapers = require("./uk");

// Organisation des scrapers par pays
const allCountryScrapers = {
  uk: ukScrapers,
  // Ajouter d'autres pays ici quand nécessaire
  // france: franceScrapers,
  // etc.
};

/**
 * Récupère tous les scrapers sous forme de liste plate avec leurs métadonnées
 * @returns {Array} Liste de tous les scrapers avec leurs informations
 */
function getAllScrapersFlat() {
  const allScrapers = [];
  let idCounter = 1;

  // Parcourir tous les pays
  for (const [countryCode, countryModule] of Object.entries(
    allCountryScrapers
  )) {
    // Parcourir toutes les villes du pays
    for (const [cityKey, cityModule] of Object.entries(
      countryModule.cityScrapers
    )) {
      // Parcourir tous les scrapers de la ville
      for (const [scraperKey, scraperFunction] of Object.entries(
        cityModule.scrapers
      )) {
        const scraperName = scraperKey.replace(/([A-Z])/g, " $1").trim();

        allScrapers.push({
          id: idCounter++,
          key: scraperKey,
          name: `${scraperName} ${cityModule.config.city}`,
          fn: scraperFunction,
          city: cityModule.config.city,
          country: countryCode,
          countryConfig: countryModule.config,
          cityConfig: cityModule.config,
        });
      }
    }
  }

  return allScrapers;
}

/**
 * Exécute le scraping pour un pays spécifique
 * @param {string} countryCode - Code du pays (uk, france, etc.)
 * @returns {Promise<Object>} Résultats du scraping
 */
async function scrapeCountry(countryCode) {
  if (!allCountryScrapers[countryCode]) {
    throw new Error(`No scrapers defined for country: ${countryCode}`);
  }

  return await allCountryScrapers[countryCode].scrapeAll();
}

/**
 * Exécute le scraping pour tous les pays configurés
 * @returns {Promise<Object>} Résultats du scraping pour tous les pays
 */
async function scrapeAllCountries() {
  const results = {};

  for (const [country, scraper] of Object.entries(allCountryScrapers)) {
    try {
      results[country] = await scraper.scrapeAll();
    } catch (error) {
      results[country] = { error: error.message };
    }
  }

  return results;
}

module.exports = {
  scrapeCountry,
  scrapeAllCountries,
  getAllScrapersFlat,
  allCountryScrapers,
};
