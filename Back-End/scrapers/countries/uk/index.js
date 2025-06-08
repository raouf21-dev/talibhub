/**
 * Index des scrapers pour le Royaume-Uni
 * Ce fichier exporte tous les scrapers disponibles pour les villes du Royaume-Uni
 */

const birminghamScrapers = require("./birmingham");
const walsallScrapers = require("./walsall");

// Configuration spécifique au Royaume-Uni
const ukConfig = {
  timezone: "Europe/London",
  dateFormat: "DD/MM/YYYY",
  countryCode: "uk",
};

// Regroupement de tous les scrapers par ville
const ukCityScrapers = {
  birmingham: birminghamScrapers,
  walsall: walsallScrapers,
  // Ajouter d'autres villes ici
};

/**
 * Exécute le scraping pour une ville spécifique du Royaume-Uni
 * @param {string} cityName - Nom de la ville
 * @returns {Promise<Object>} Résultats du scraping
 */
async function scrapeCity(cityName) {
  if (!ukCityScrapers[cityName]) {
    throw new Error(`No scrapers defined for UK city: ${cityName}`);
  }

  return await ukCityScrapers[cityName].scrapeAll();
}

/**
 * Exécute le scraping pour toutes les villes configurées du Royaume-Uni
 * @returns {Promise<Object>} Résultats du scraping pour toutes les villes
 */
async function scrapeAll() {
  const results = {
    country: "United Kingdom",
    cities: {},
    timestamp: new Date().toISOString(),
  };

  for (const [city, scraper] of Object.entries(ukCityScrapers)) {
    try {
      results.cities[city] = await scraper.scrapeAll();
    } catch (error) {
      results.cities[city] = { error: error.message };
    }
  }

  return results;
}

module.exports = {
  scrapeCity,
  scrapeAll,
  config: ukConfig,
  cityScrapers: ukCityScrapers,
};
