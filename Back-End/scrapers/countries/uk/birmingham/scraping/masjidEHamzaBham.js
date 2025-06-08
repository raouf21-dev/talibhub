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
 * SCRAPER OPTIMISÉ - scrapeMasjidEHamza
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
const scrapeMasjidEHamza = createOptimizedScraper(async (page) => {

    await page.goto("http://www.masjidehamza.co.uk/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForSelector('table[width="95%"] tr', { timeout: 15000 });

    const rawTimes = await page.evaluate(() => {
      const prayerTimes = {};
      const rows = document.querySelectorAll('table[width="95%"] tr');

      rows.forEach((row) => {
        // Chercher le nom de la prière
        const strongElement = row.querySelector(
          'strong[style*="color:#272727"]'
        );
        if (strongElement) {
          const prayerName = strongElement.textContent.trim().toLowerCase();
          // Prendre la dernière cellule qui contient l'heure de Jama'ah
          const cells = row.querySelectorAll(
            'td[align="center"][valign="top"]'
          );
          if (cells.length > 0) {
            const lastCell = cells[cells.length - 1];
            const time = lastCell.textContent.trim();
            if (time && time !== "" && !time.includes("whitespace")) {
              prayerTimes[prayerName] = time;
            }
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
      source: "Masjid E Hamza Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
});

module.exports = scrapeMasjidEHamza;
