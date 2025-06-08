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
 * SCRAPER OPTIMISÉ - Green Lane Masjid Birmingham
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
const scrapeGreenLaneMasjid = createOptimizedScraper(async (page) => {
  console.log("Navigation en cours...");

  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount < maxRetries) {
    try {
      await page.goto("https://greenlanemasjid.org/", {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });

      // Simulation rapide de comportement humain
      await Promise.all([
        humanBehavior.randomDelay(100, 200),
        humanBehavior.simulateScroll(page),
      ]);

      // Vérification que la page contient les horaires de prière
      const hasTable = await page.$("table tbody tr");
      if (hasTable) {
        console.log("Page chargée avec succès");
        break;
      } else {
        throw new Error("Contenu de la page non valide");
      }
    } catch (error) {
      retryCount++;
      if (retryCount === maxRetries) {
        throw error;
      }
      console.log(`Tentative ${retryCount}/${maxRetries}`);
      await humanBehavior.randomDelay(2000, 3000);
    }
  }

  // Simulation de mouvement de souris vers le tableau
  await humanBehavior.moveMouseRandomly(page, "table tbody");

  console.log("Extraction des horaires en cours...");

  const rawTimes = await page.evaluate(() => {
    const prayerTimes = {};
    const rows = document.querySelectorAll("table tbody tr");

    rows.forEach((row) => {
      const prayerName = row
        .querySelector(".prayer_time")
        ?.textContent.trim()
        .toLowerCase();
      if (!prayerName) return;

      const cells = row.querySelectorAll("td");
      if (cells.length >= 4) {
        const jamaahTime =
          cells[3].textContent.trim() || cells[2].textContent.trim();
        if (jamaahTime) {
          prayerTimes[prayerName] = jamaahTime;
        }
      }
    });

    return prayerTimes;
  });

  if (!rawTimes || Object.keys(rawTimes).length === 0) {
    throw new Error("Aucun horaire de prière trouvé");
  }

  console.log("Normalisation des données...");

  const normalizedTimes = {};
  for (let [prayer, time] of Object.entries(rawTimes)) {
    prayer = prayerUtils.standardizePrayerName(prayer);
    const normalizedTime = normalizeTime(time);
    if (normalizedTime) {
      normalizedTimes[prayer] = normalizedTime;
    }
  }

  const result = {
    source: "Green Lane Masjid Birmingham",
    date: dateUtils.getUKDate(),
    times: normalizedTimes,
  };

  const standardizedResult = prayerUtils.normalizeResult(result);

  console.log("Données extraites avec succès:", standardizedResult);
  return standardizedResult;
});

module.exports = scrapeGreenLaneMasjid;
