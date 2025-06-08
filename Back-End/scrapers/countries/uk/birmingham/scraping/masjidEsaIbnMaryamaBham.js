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
 * SCRAPER OPTIMISÉ - scrapeEsaIbnMaryama
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
const scrapeEsaIbnMaryama = createOptimizedScraper(async (page) => {

    await page.goto("https://arrahma.co.uk/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForSelector("table.dptTimetable", { timeout: 15000 });

    const rawTimes = await page.evaluate(() => {
      const prayerTimes = {};

      // Méthode directe basée sur la structure du tableau observée
      const rows = document.querySelectorAll("table.dptTimetable tbody tr");

      rows.forEach((row) => {
        // Ignorer les lignes d'en-tête
        const prayerNameElement = row.querySelector("th.prayerName");
        if (!prayerNameElement) return;

        const prayerName = prayerNameElement.textContent.trim().toLowerCase();

        // Rechercher la cellule jamah dans cette ligne
        const jamaahCell = row.querySelector("td.jamah");
        if (!jamaahCell) return;

        const jamaahTime = jamaahCell.textContent.trim();

        if (jamaahTime && !jamaahTime.includes("-")) {
          prayerTimes[prayerName] = jamaahTime;
        }
      });

      // Si la méthode directe échoue, on utilise la méthode alternative
      if (Object.keys(prayerTimes).length < 5) {
        // Méthode alternative: trouver tous les éléments par classe
        const prayerNameElements = document.querySelectorAll("th.prayerName");
        const jamahElements = document.querySelectorAll("td.jamah");

        prayerNameElements.forEach((element, index) => {
          if (index < jamahElements.length) {
            const name = element.textContent.trim().toLowerCase();
            const time = jamahElements[index].textContent.trim();

            if (time && !time.includes("-")) {
              prayerTimes[name] = time;
            }
          }
        });
      }

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
      source: "Masjid Esa ibn Maryama Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
});

module.exports = scrapeEsaIbnMaryama;
