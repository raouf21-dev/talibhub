const {
  /**
   * ✅ SCRAPER OPTIMISÉ
   * Configuration automatique via browser-manager :
   * - Viewport 1920x1080
   * - User agent aléatoire
   * - Comportement humain
   * - Interception ressources (images, CSS, fonts)
   */
  /**
   * ✅ SCRAPER OPTIMISÉ
   * Configuration automatique via browser-manager :
   * - Viewport 1920x1080
   * - User agent aléatoire
   * - Comportement humain
   * - Interception ressources (images, CSS, fonts)
   */
  createOptimizedScraper,
} = require("../../../../utils/scraper-template");
const {
  normalizeTime,
  dateUtils,
  prayerUtils,
} = require("../../../../utils/scraper");
const humanBehavior = require("../../../../utils/human-behavior");

/**
 * SCRAPER OPTIMISÉ - scrapeAbuBakr
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
const scrapeAbuBakr = createOptimizedScraper(async (page) => {
  await page.goto("https://abubakrbillesley.co.uk", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  await Promise.all([
    humanBehavior.randomDelay(100, 200),
    humanBehavior.simulateScroll(page),
    page.waitForSelector("table tbody", { timeout: 30000 }),
  ]);

  const rawTimes = await page.evaluate(() => {
    const prayerTimes = {};
    const rows = document.querySelectorAll("table tbody tr");

    rows.forEach((row) => {
      const prayerCell = row.querySelector("td:first-child");
      const timeCell = row.querySelector("td:last-child");

      if (prayerCell && timeCell) {
        const prayerName = prayerCell.textContent.trim().toLowerCase();
        const time = timeCell.textContent.trim();

        // Ignorer les lignes de jumu'ah
        if (!prayerName.includes("jumu")) {
          prayerTimes[prayerName] = time;
        }
      }
    });

    return prayerTimes;
  });

  console.log("Données brutes extraites:", rawTimes);

  const normalizedTimes = {};
  for (let [prayer, time] of Object.entries(rawTimes)) {
    prayer = prayerUtils.standardizePrayerName(prayer);
    if (prayer) {
      const normalizedTime = normalizeTime(time);
      if (normalizedTime) {
        normalizedTimes[prayer] = normalizedTime;
      }
    }
  }

  const result = {
    source: "Masjid-e-Abu Bakr Birmingham",
    date: dateUtils.getUKDate(),
    times: normalizedTimes,
  };

  const standardizedResult = prayerUtils.normalizeResult(result);
  console.log("Données normalisées:", standardizedResult);
  return standardizedResult;
});

module.exports = scrapeAbuBakr;
