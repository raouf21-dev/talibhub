/**
 * ✅ SCRAPER OPTIMISÉ
 * Configuration automatique via browser-manager :
 * - Viewport 1920x1080
 * - User agent aléatoire
 * - Comportement humain
 * - Interception ressources (images, CSS, fonts)
 */
const { createOptimizedScraper } = require("../../../../utils/scraper-template");

  // ⚠️ INTERCEPTION GÉRÉE CENTRALEMENT
  // L'interception est automatiquement configurée par browser-manager
  // Ne pas désactiver ou reconfigurer manuellement
const {
  normalizeTime,
  dateUtils,
  prayerUtils
} = require("../../../../utils/scraper");
const humanBehavior = require("../../../../utils/human-behavior");

/**
 * SCRAPER OPTIMISÉ - scrapeMasjidAlAqsaWalsall
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
const scrapeMasjidAlAqsaWalsall = createOptimizedScraper(async (page) => {

    console.log("Navigation en cours...");

    await page.goto("https://masjid-alaqsa-walsall.co.uk/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Simulation de comportement humain sur la page principale
    await Promise.all([
      humanBehavior.randomDelay(100, 200),
      humanBehavior.simulateScroll(page),
    ]);

    console.log("Accès à l'iframe...");

    // Attendre et accéder à l'iframe
    await page.waitForSelector("iframe#go2frame", { timeout: 30000 });
    const frameHandle = await page.$("iframe#go2frame");
    frame = await frameHandle.contentFrame();

    if (!frame) {
      throw new Error(
        "Impossible d'accéder au contenu de l'iframe (restrictions cross-origin possibles)."
      );
    }

    // Attendre que le tableau soit chargé dans l'iframe
    await frame.waitForSelector("table#table2", { timeout: 30000 });

    console.log("Extraction des horaires en cours...");

    const rawTimes = await frame.evaluate(() => {
      const prayerTimes = {};
      const idMapping = {
        fajarJamat: "fajr",
        zuhrJamat: "dhuhr",
        asarJamat: "asr",
        maghribJamat: "maghrib",
        eshaJamat: "esha",
      };

      for (const [elementId, prayerName] of Object.entries(idMapping)) {
        const element = document.getElementById(elementId);
        if (element) {
          let time = element.textContent.trim();
          // Nettoyage du texte pour enlever "am" ou "pm" si présent
          time = time.toLowerCase().replace("am", "").replace("pm", "").trim();
          if (time) {
            prayerTimes[prayerName] = time;
          }
        }
      }

      return prayerTimes;
    });

    if (!rawTimes || Object.keys(rawTimes).length === 0) {
      throw new Error("Aucun horaire de prière trouvé");
    }

    console.log("Données brutes extraites:", rawTimes);

    console.log("Normalisation des données...");

    const normalizedTimes = {};
    for (let [prayer, time] of Object.entries(rawTimes)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      if (prayer) {
        const normalizedTime = normalizeTime(time, prayer);
        if (normalizedTime) {
          normalizedTimes[prayer] = normalizedTime;
        }
      }
    }

    const result = {
      source: "Masjid Al-Aqsa Walsall",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données extraites avec succès:", standardizedResult);
    return standardizedResult;
});

module.exports = scrapeMasjidAlAqsaWalsall;
