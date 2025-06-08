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
 * SCRAPER OPTIMISÉ - scrapeJameMasjid
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
const scrapeJameMasjid = createOptimizedScraper(async (page) => {

    console.log("Navigation en cours...");

    await page.goto("https://www.birminghamjamemasjid.org.uk/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await Promise.all([
      humanBehavior.randomDelay(100, 200),
      humanBehavior.simulateScroll(page),
    ]);

    console.log("Accès à l'iframe...");

    await page.waitForSelector("iframe", { timeout: 30000 });
    const frameHandle = await page.$("iframe");
    frame = await frameHandle.contentFrame();

    if (!frame) {
      throw new Error("Impossible d'accéder au contenu de l'iframe");
    }

    await frame.waitForSelector(".title.korolev", { timeout: 15000 });

    console.log("Extraction des horaires...");

    const rawData = await frame.evaluate(() => {
      const times = {};
      const prayerItems = document.querySelectorAll(
        ".styles__Item-sc-1h272ay-1"
      );
      const allowedPrayers = ["fajr", "zuhar", "asr", "maghrib", "isha"];

      prayerItems.forEach((item) => {
        try {
          const nameSpan = item.querySelector('span[class^="styles-sc"]');
          if (!nameSpan) return;

          const prayerName = nameSpan.textContent.trim().toLowerCase();

          if (!allowedPrayers.includes(prayerName)) return;

          const timeElement = item.querySelector(".time.mono");
          if (!timeElement) return;

          let timeText = "";
          timeElement.childNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              timeText += node.textContent.trim();
            }
          });

          const cleanTime = timeText.replace(/[^\d]/g, "");
          let formattedTime;

          if (cleanTime.length <= 2) {
            formattedTime = `${cleanTime.padStart(2, "0")}:00`;
          } else if (cleanTime.length === 3) {
            formattedTime = `${cleanTime
              .slice(0, 1)
              .padStart(2, "0")}:${cleanTime.slice(1)}`;
          } else if (cleanTime.length >= 4) {
            formattedTime = `${cleanTime
              .slice(0, 2)
              .padStart(2, "0")}:${cleanTime.slice(2, 4)}`;
          }

          if (formattedTime) {
            times[prayerName] = formattedTime;
          }
        } catch (error) {
          console.error("Erreur lors du traitement de la prière:", error);
        }
      });

      return times;
    });

    console.log("Données brutes extraites:", rawData);

    if (!rawData || Object.keys(rawData).length === 0) {
      throw new Error("Aucune donnée extraite");
    }

    console.log("Normalisation des données...");

    const normalizedTimes = {};
    for (let [prayer, time] of Object.entries(rawData)) {
      const standardizedName = prayerUtils.standardizePrayerName(prayer);
      if (standardizedName) {
        const normalizedTime = normalizeTime(time, standardizedName);
        if (normalizedTime) {
          normalizedTimes[standardizedName] = normalizedTime;
        }
      }
    }

    const result = {
      source: "Birmingham Jame Masjid",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);

    return standardizedResult;
});

module.exports = scrapeJameMasjid;
