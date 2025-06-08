/**
 * ✅ SCRAPER OPTIMISÉ
 * Configuration automatique via browser-manager :
 * - Viewport 1920x1080
 * - User agent aléatoire
 * - Comportement humain
 * - Interception ressources (images, CSS, fonts)
 */
const { createOptimizedScraper } = require("../../../../utils/scraper-template");
const {
  normalizeTime,
  dateUtils,
  prayerUtils
} = require("../../../../utils/scraper");
const humanBehavior = require("../../../../utils/human-behavior");

/**
 * SCRAPER OPTIMISÉ - scrapeMasjidAlFarouq
 * Migré vers le pool centralisé pour performance optimale
 */
/**
 * ✅ SCRAPER OPTIMISÉ
 * Configuration automatique via browser-manager :
 * - Viewport 1920x1080
 * - User agent aléatoire
 * - Comportement humain
 * - Interception ressources (images, CSS, fonts)
 */
const scrapeMasjidAlFarouq = createOptimizedScraper(async (page) => {

    console.log("Navigation en cours...");

    await page.goto("https://www.masjidalfarouq.org.uk", {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    // Attendre le chargement du contenu dynamique
    await page.waitForSelector("body", { timeout: 10000 });
    await humanBehavior.simulateScroll(page);

    console.log("Extraction des données...");

    // Nouvelle méthode d'extraction basée sur l'analyse du site
    const data = await page.evaluate(() => {
      const times = {};
      const allText = document.body.innerText;

      // Rechercher les patterns de prières avec leurs horaires
      const prayers = ["fajr", "zuhr", "asr", "maghrib", "isha"];

      prayers.forEach((prayer) => {
        // Pattern pour chercher le nom de la prière suivi des horaires
        const prayerPattern = new RegExp(
          prayer + "\\s*[\\s\\S]*?(\\d{1,2}:\\d{2})[\\s\\S]*?(\\d{1,2}:\\d{2})",
          "i"
        );

        const match = allText.match(prayerPattern);
        if (match) {
          // Le premier horaire est généralement l'heure de début, le second l'heure de jamaat
          const startTime = match[1];
          const jamaatTime = match[2];

          // Utiliser l'heure de jamaat comme heure principale
          times[prayer] = jamaatTime || startTime;
        }
      });

      return times;
    });

    console.log("Données brutes extraites:", data);

    // Vérifier si nous avons des données
    if (!data || Object.keys(data).length === 0) {
      throw new Error("Aucune donnée extraite du site");
    }

    console.log("Normalisation des données...");

    // Normalisation avec prise en compte du type de prière
    const normalizedTimes = {};
    for (let [prayer, time] of Object.entries(data)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      if (prayer && time) {
        const normalizedTime = normalizeTime(time, prayer);
        if (normalizedTime) {
          normalizedTimes[prayer] = normalizedTime;
        }
      }
    }

    const result = {
      source: "Masjid Al-Farouq Walsall",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
});

module.exports = scrapeMasjidAlFarouq;
