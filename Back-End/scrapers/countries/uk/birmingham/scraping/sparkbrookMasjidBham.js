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
 * SCRAPER OPTIMISÉ - scrapeSparkbrookMasjid
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
const scrapeSparkbrookMasjid = createOptimizedScraper(async (page) => {

    console.log("Navigation en cours...");

    await page.goto("https://www.sparkbrookmasjid.co.uk/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await Promise.all([
      humanBehavior.randomDelay(100, 200),
      humanBehavior.simulateScroll(page),
    ]);

    console.log("Attente du chargement des éléments...");
    await page.waitForSelector("table.dptTimetable", { timeout: 15000 });

    await humanBehavior.moveMouseRandomly(page, "table.dptTimetable");

    console.log("Extraction des données...");
    const rawTimes = await page.evaluate(() => {
      const prayerTimes = {};
      const rows = document.querySelectorAll("table.dptTimetable tr");

      rows.forEach((row) => {
        const prayerNameCell = row.querySelector("th.prayerName");
        const jamahCell = row.querySelector("td.jamah");

        if (prayerNameCell && jamahCell) {
          let prayerName = prayerNameCell.textContent.trim().toLowerCase();
          const jamahTime = jamahCell.textContent.trim();

          // Nettoyer le temps (enlever les "am" et "pm")
          const cleanTime = jamahTime.replace(/\s*(?:am|pm)\s*/i, "").trim();

          // Faire correspondre les noms de prière
          if (prayerName === "zuhr") prayerName = "dhuhr";
          if (prayerName.includes("sunrise")) return; // Ignorer sunrise

          prayerTimes[prayerName] = cleanTime;
        }
      });

      return prayerTimes;
    });

    console.log("Données brutes extraites:", rawTimes);

    console.log("Normalisation des données...");

    // Normalisation des temps
    const normalizedTimes = {};
    for (let [prayer, time] of Object.entries(rawTimes)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      if (prayer) {
        const normalizedTime = normalizeTime(time, prayer); // Ajout du paramètre prayer
        if (normalizedTime) {
          normalizedTimes[prayer] = normalizedTime;
        }
      }
    }

    const result = {
      source: "Sparkbrook Masjid Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
});

module.exports = scrapeSparkbrookMasjid;
