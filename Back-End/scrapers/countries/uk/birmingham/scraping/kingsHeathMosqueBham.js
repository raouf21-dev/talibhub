/**
 * ✅ SCRAPER OPTIMISÉ
 * Configuration automatique via browser-manager :
 * - Viewport 1920x1080
 * - User agent aléatoire
 * - Comportement humain
 * - Interception ressources (images, CSS, fonts)
 */
const {
  createOptimizedScraper,
} = require("../../../../utils/scraper-template");
const {
  normalizeTime,
  dateUtils,
  prayerUtils,
} = require("../../../../utils/scraper");
const humanBehavior = require("../../../../utils/human-behavior");

/**
 * SCRAPER OPTIMISÉ - scrapeKingsHeathMosque
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
const scrapeKingsHeathMosque = createOptimizedScraper(async (page) => {
  await page.goto(
    "https://prayersconnect.com/mosques/82643541-kings-heath-mosque-birmingham-england-united-kingdom",
    {
      waitUntil: "networkidle2",
      timeout: 30000,
    }
  );

  await Promise.all([
    humanBehavior.randomDelay(100, 200),
    humanBehavior.simulateScroll(page),
    page.waitForSelector(".MuiGrid-root.css-7ka3qr", { timeout: 30000 }),
  ]);

  const rawTimes = await page.evaluate(() => {
    const prayerTimes = {};
    const cells = document.querySelectorAll(".MuiGrid-root.css-7ka3qr");
    const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

    cells.forEach((cell, index) => {
      if (index < prayers.length) {
        const time = cell.textContent.trim();
        if (time) {
          prayerTimes[prayers[index]] = time;
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
    source: "Kings Heath Mosque Birmingham",
    date: dateUtils.getUKDate(),
    times: normalizedTimes,
  };

  const standardizedResult = prayerUtils.normalizeResult(result);
  console.log("Données normalisées:", standardizedResult);
  return standardizedResult;
});

module.exports = scrapeKingsHeathMosque;
