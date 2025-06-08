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
 * SCRAPER OPTIMISÉ - scrapeMasjidUmarBham
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
const scrapeMasjidUmarBham = createOptimizedScraper(async (page) => {

    console.log("Navigation en cours...");

    await page.goto(
      "https://mosquefinder.co.uk/masjid-umar-birmingham/salaah-timings",
      {
        waitUntil: "networkidle2",
        timeout: 30000,
      }
    );

    await Promise.all([
      humanBehavior.randomDelay(100, 200),
      humanBehavior.simulateScroll(page),
      page.waitForSelector("table.tw.widget-timming", { timeout: 30000 }),
    ]);

    await humanBehavior.moveMouseRandomly(page, "table.tw.widget-timming");

    console.log("Extraction des données...");
    const data = await page.evaluate(() => {
      const times = {};
      const prayerRows = document.querySelectorAll(
        "table.tw.widget-timming tbody tr"
      );

      prayerRows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 3) {
          let prayerName = cells[0].textContent.trim().toLowerCase();
          // On prend le temps dans la dernière colonne (text-right)
          let time = cells[cells.length - 1].textContent.trim();

          // Correction pour "Fair" -> "Fajr"
          if (prayerName === "fair") prayerName = "fajr";
          times[prayerName] = time;
        }
      });

      return times;
    });

    console.log("Données brutes extraites:", data);

    console.log("Normalisation des données...");

    const normalizedTimes = {};
    for (let [prayer, time] of Object.entries(data)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      if (prayer) {
        const normalizedTime = normalizeTime(time, prayer);
        if (normalizedTime) {
          normalizedTimes[prayer] = normalizedTime;
        }
      }
    }

    const result = {
      source: "Masjid Umar Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
});

module.exports = scrapeMasjidUmarBham;
