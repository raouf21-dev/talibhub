/**
 * Index des scrapers pour Birmingham
 * Ce fichier exporte tous les scrapers pour les mosquées de Birmingham
 */

// Configuration pour Birmingham
const birminghamConfig = {
  city: "Birmingham",
  region: "West Midlands",
  country: "uk",
  coordinates: {
    latitude: 52.4862,
    longitude: -1.8904,
  },
};

// Import des scrapers existants
// Note: Les chemins seront mis à jour après la migration
const scrapers = {
  amanahMasjid: require("./scraping/amanahMasjidBham"),
  arRahmaCentre: require("./scraping/arRahmaCentreBham"),
  bournvilleMasjid: require("./scraping/bournvilleMasjidBham"),
  centralMosque: require("./scraping/centralMosqueBham"),
  greenLaneMasjid: require("./scraping/greenLaneMasjidBham"),
  hallGreenMosque: require("./scraping/hallGreenMosqueBham"),
  jameMasjid: require("./scraping/jameMasjidBham"),
  kingsHeathMosque: require("./scraping/kingsHeathMosqueBham"),
  mahmudSabirMasjid: require("./scraping/mahmudSabirMasjidBham"),
  masjidAbuBakrBham: require("./scraping/masjidAbuBakrBham"),
  masjidAnnoor: require("./scraping/masjidAnnoorBirmingham"),
  masjidAsSunnahAnNabawiyyah: require("./scraping/masjidAs-SunnahAn-NabawiyyahBham"),
  masjidEHamza: require("./scraping/masjidEHamzaBham"),
  masjidEsaIbnMaryama: require("./scraping/masjidEsaIbnMaryamaBham"),
  masjidSulayman: require("./scraping/masjidSulaymanBham"),
  masjidUmar: require("./scraping/masjidUmarBham"),
  muslimStudentsHouse: require("./scraping/muslimStudentsHouseBham"),
  qubaIsmalicCenter: require("./scraping/qubaIsmalicCenterBham"),
  sparkbrookMasjid: require("./scraping/sparkbrookMasjidBham"),
};

/**
 * Exécute le scraping pour toutes les mosquées de Birmingham
 * @returns {Promise<Object>} Résultats du scraping pour Birmingham
 */
async function scrapeAll() {
  console.log(`[SCRAPER] Démarrage du scraping pour Birmingham`);
  const startTime = Date.now();

  const results = {
    city: "Birmingham",
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
    `[SCRAPER] Scraping terminé pour Birmingham en ${results.durationMs}ms - Résultats: ${results.successCount}, Erreurs: ${results.errorCount}`
  );

  return results;
}

/**
 * Exécute le scraping pour une mosquée spécifique de Birmingham
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
  config: birminghamConfig,
  scrapers,
};
