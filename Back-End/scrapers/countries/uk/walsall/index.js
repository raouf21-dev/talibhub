/**
 * Index des scrapers pour Walsall
 * Ce fichier exporte tous les scrapers pour les mosquées de Walsall
 */

// Configuration pour Walsall
const walsallConfig = {
  city: "Walsall",
  region: "West Midlands",
  country: "uk",
  coordinates: {
    latitude: 52.5864,
    longitude: -1.982,
  },
};

// Import des scrapers existants
// Note: Les chemins seront mis à jour après la migration
const scrapers = {
  aishaMosque: require("./scraping/aishaMosqueWalsall"),
  masjidAbuBakr: require("./scraping/masjidAbuBakrWalsall"),
  masjidAlAqsa: require("./scraping/masjidAlAqsaWalsall"),
  masjidAlfarouq: require("./scraping/masjidAlfarouqWalsall"),
  masjidEUsman: require("./scraping/masjidEUsmanWalsall"),
  // Note: testMosqueTourade est probablement un fichier de test et est donc exclu
};

/**
 * Exécute le scraping pour toutes les mosquées de Walsall
 * @returns {Promise<Object>} Résultats du scraping pour Walsall
 */
async function scrapeAll() {
  console.log(`[SCRAPER] Démarrage du scraping pour Walsall`);
  const startTime = Date.now();

  const results = {
    city: "Walsall",
    mosques: [],
    errors: [],
    totalScrapers: Object.keys(scrapers).length,
    timestamp: new Date().toISOString(),
  };

  // Exécuter chaque scraper et collecter les résultats
  for (const [mosqueId, scraper] of Object.entries(scrapers)) {
    try {
      const mosqueData = await scraper.scrape();
      results.mosques.push(mosqueData);
      console.log(`[SCRAPER] Succès: ${mosqueId}`);
    } catch (error) {
      console.error(`[SCRAPER] Erreur pour ${mosqueId}:`, error.message);
      results.errors.push({
        mosque: mosqueId,
        error: error.message,
      });
    }
  }

  const endTime = Date.now();
  results.durationMs = endTime - startTime;
  results.successCount = results.mosques.length;
  results.errorCount = results.errors.length;

  console.log(
    `[SCRAPER] Scraping terminé pour Walsall en ${results.durationMs}ms - Résultats: ${results.successCount}, Erreurs: ${results.errorCount}`
  );

  return results;
}

/**
 * Exécute le scraping pour une mosquée spécifique de Walsall
 * @param {string} mosqueId - Identifiant de la mosquée
 * @returns {Promise<Object>} Données pour la mosquée
 */
async function scrapeMosque(mosqueId) {
  if (!scrapers[mosqueId]) {
    throw new Error(`Mosquée non trouvée: ${mosqueId}`);
  }

  return await scrapers[mosqueId].scrape();
}

module.exports = {
  scrapeAll,
  scrapeMosque,
  config: walsallConfig,
  scrapers,
};
