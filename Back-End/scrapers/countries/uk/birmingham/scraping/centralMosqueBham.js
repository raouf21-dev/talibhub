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
 * SCRAPER OPTIMISÉ - scraper
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
const scraper = createOptimizedScraper(async (page) => {

    console.log("Navigation en cours...");

    await page.goto("http://centralmosque.org.uk", {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    // Simulation rapide de comportement humain
    await Promise.all([
      humanBehavior.randomDelay(100, 200),
      humanBehavior.simulateScroll(page),
    ]);

    await page.waitForSelector(".mptt-wrapper-container", {
      timeout: 15000,
      visible: true,
    });

    // Simulation de mouvement de souris vers le tableau des prières
    await humanBehavior.moveMouseRandomly(page, ".mptt-wrapper-container");

    console.log("Extraction des horaires en cours...");

    const data = await page.evaluate(() => {
      const prayers = {};
      const prayerElements = document.querySelectorAll(".prayer-time");

      prayerElements.forEach((element) => {
        const titleElement = element.querySelector(".mptt-sec-title");
        const jamaatElement = element.querySelector(".prayer-jamaat");

        if (titleElement && jamaatElement) {
          let title = titleElement.textContent.trim().toLowerCase();
          const jamaatTime = jamaatElement.textContent.trim();

          if (title === "zuhr") {
            title = "dhuhr";
          }

          prayers[title] = jamaatTime;
        }
      });

      return prayers;
    });

    if (!data || Object.keys(data).length === 0) {
      throw new Error("Aucun horaire de prière trouvé");
    }

    console.log("Normalisation des données...");

    const normalizedTimes = {};
    for (let [prayer, time] of Object.entries(data)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      const normalizedTime = normalizeTime(time);
      if (normalizedTime) {
        normalizedTimes[prayer] = normalizedTime;
      }
    }

    const result = {
      source: "Central Mosque Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);

    console.log("Données extraites avec succès:", standardizedResult);
    return standardizedResult;
});

module.exports = scraper;
