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
 * SCRAPER OPTIMISÉ - scrapeMasjidEUsman
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
const scrapeMasjidEUsman = createOptimizedScraper(async (page) => {

    await page.goto("https://masjid-e-usman.org", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await Promise.all([
      humanBehavior.randomDelay(100, 200),
      humanBehavior.simulateScroll(page),
      page.waitForSelector("span.dpt_jamah", { timeout: 30000 }),
    ]);

    const rawTimes = await page.evaluate(() => {
      const prayerTimes = {};
      const jamahElements = document.querySelectorAll(
        "span.dpt_jamah:not(.prayerfinished)"
      );
      const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

      let prayerIndex = 0;
      jamahElements.forEach((element) => {
        if (prayerIndex < prayers.length) {
          const time = element.textContent.trim();
          // Ne pas inclure les horaires de Jumu'ah
          if (!time.toLowerCase().includes("jumu")) {
            prayerTimes[prayers[prayerIndex]] = time;
            prayerIndex++;
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
      source: "Masjid-e-Usman Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
});

module.exports = scrapeMasjidEUsman;
