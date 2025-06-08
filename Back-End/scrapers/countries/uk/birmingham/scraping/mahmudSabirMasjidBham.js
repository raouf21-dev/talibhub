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
 * SCRAPER OPTIMISÉ - scrapeMahmudSabirMasjid
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
const scrapeMahmudSabirMasjid = createOptimizedScraper(async (page) => {

    console.log("Navigation en cours...");

    await page.goto(
      "https://mawaqit.net/en/mahmudsabir-al-furqan-masjid-birmingham-b11-3bz-united-kingdom",
      {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      }
    );

    await Promise.all([
      humanBehavior.randomDelay(100, 200),
      humanBehavior.simulateScroll(page),
    ]);

    console.log("Attente du chargement des éléments...");
    await page.waitForSelector("div.prayers", { timeout: 15000 });
    await page.waitForFunction(
      () => document.querySelectorAll("div.prayers > div").length > 0,
      { timeout: 10000 }
    );

    await humanBehavior.moveMouseRandomly(page, "div.prayers");

    console.log("Extraction des données...");
    const rawTimes = await page.evaluate(() => {
      const prayerTimes = {};
      const prayerElements = document.querySelectorAll("div.prayers > div");

      prayerElements.forEach((prayerElement) => {
        const nameElement = prayerElement.querySelector("div.name");
        const timeElement = prayerElement.querySelector("div.time");
        const waitElement = prayerElement.querySelector("div.wait > div");

        if (nameElement && timeElement) {
          let prayerName = nameElement.textContent.trim().toLowerCase();
          const baseTime = timeElement.textContent.trim();
          // Récupération directe du temps dans le div wait (format: HH:mm)
          const jamahTime = waitElement ? waitElement.textContent.trim() : null;

          prayerTimes[prayerName] = {
            baseTime: baseTime,
            jamahTime: jamahTime,
          };
        }
      });

      return prayerTimes;
    });

    console.log("Données brutes extraites:", rawTimes);

    console.log("Normalisation des données...");

    // Normalisation avec priorité aux horaires Jamah
    const normalizedTimes = {};
    for (let [prayer, data] of Object.entries(rawTimes)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      if (prayer) {
        // On utilise le temps Jamah s'il est disponible
        const timeToNormalize = data.jamahTime || data.baseTime;
        const normalizedTime = normalizeTime(timeToNormalize);
        if (normalizedTime) {
          normalizedTimes[prayer] = normalizedTime;
        }
      }
    }

    const result = {
      source: "MahmudSabir Al Furqan Masjid Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
});

module.exports = scrapeMahmudSabirMasjid;
