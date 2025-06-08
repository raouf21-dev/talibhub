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
 * SCRAPER OPTIMISÉ - scrapeQubaIsmalicCenter
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
const scrapeQubaIsmalicCenter = createOptimizedScraper(async (page) => {

    console.log("Navigation en cours...");

    await page.goto(
      "https://mawaqit.net/en/quba-islamic-cultural-centre-birmingham-b7-4ny-united-kingdom/",
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
          const offset = waitElement ? waitElement.textContent.trim() : null;

          prayerTimes[prayerName] = {
            baseTime: baseTime,
            offset: offset,
          };
        }
      });

      return prayerTimes;
    });

    console.log("Données brutes extraites:", rawTimes);

    console.log("Normalisation des données...");

    // Normalisation avec priorité à l'offset
    const normalizedTimes = {};
    for (let [prayer, data] of Object.entries(rawTimes)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      if (prayer) {
        // Si l'offset est une heure jamaah complète (ex: "07:00"), utiliser cette heure
        if (data.offset && data.offset.match(/^\d{1,2}:\d{2}$/)) {
          normalizedTimes[prayer] = normalizeTime(data.offset);
        }
        // Si l'offset est au format +X minutes ou nul, utiliser le baseTime
        else {
          normalizedTimes[prayer] = normalizeTime(data.baseTime);
        }
      }
    }

    const result = {
      source: "Quba Islamic Center Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
});

module.exports = scrapeQubaIsmalicCenter;
