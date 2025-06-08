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
 * SCRAPER OPTIMISÉ - scrapeAishaMosque
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
const scrapeAishaMosque = createOptimizedScraper(async (page) => {

    console.log("Navigation en cours...");

    await page.goto("https://www.aishamosque.org/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Simulation de comportement humain sur la page principale
    await Promise.all([
      humanBehavior.randomDelay(100, 200),
      humanBehavior.simulateScroll(page),
    ]);

    console.log("Accès à l'iframe...");

    // Gestion de l'iframe avec timeout plus long
    await page.waitForSelector("iframe", { timeout: 30000 });
    const frameHandle = await page.$("iframe");
    frame = await frameHandle.contentFrame();

    if (!frame) {
      throw new Error(
        "Impossible d'accéder au contenu de l'iframe (restrictions cross-origin possibles)."
      );
    }

    // Attente des sélecteurs dans l'iframe avec timeout plus long
    try {
      await frame.waitForSelector(".mbx-widget-timetable-nav-date", {
        timeout: 20000,
      });
    } catch (timeoutError) {
      console.log(
        "⚠️  Timeout sur .mbx-widget-timetable-nav-date, tentative de fallback..."
      );

      // Essayer avec un sélecteur plus général
      try {
        await frame.waitForSelector("div", { timeout: 10000 });
        console.log("✅ Fallback réussi, continuons avec l'extraction...");
      } catch (fallbackError) {
        console.error("❌ Échec total d'accès au contenu de l'iframe");
        throw new Error(
          "Impossible d'accéder au contenu de l'iframe après multiple tentatives"
        );
      }
    }

    console.log("Extraction des horaires...");

    // Nouvelle méthode d'extraction adaptée à la structure fragmentée
    const times = await frame.evaluate(() => {
      const prayerTimes = {};

      // Méthode 1: Extraction via le texte complet
      const allText = document.body.innerText;

      // Patterns pour extraire les horaires avec AM/PM
      const prayerPatterns = {
        fajr: /FAJR[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(AM|PM)/i,
        zuhr: /ZUHR[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(AM|PM)/i,
        asr: /ASR[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(AM|PM)/i,
        maghrib: /MAGHRIB[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(AM|PM)/i,
        isha: /ISHA[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(AM|PM)/i,
      };

      for (const [prayer, pattern] of Object.entries(prayerPatterns)) {
        const match = allText.match(pattern);
        if (match) {
          const hours = match[1];
          const minutes = match[2];
          const period = match[3];
          prayerTimes[prayer] = `${hours}:${minutes} ${period}`;
        }
      }

      // Méthode 2: Si la première méthode échoue, essayer avec les sélecteurs CSS
      if (Object.keys(prayerTimes).length === 0) {
        const prayerItems = document.querySelectorAll(
          ".styles__Item-sc-1h272ay-1"
        );

        prayerItems.forEach((item) => {
          const titleElement = item.querySelector(".title");
          const timeElement = item.querySelector(".time.mono");

          if (titleElement && timeElement) {
            let prayerName = titleElement.textContent.trim().toLowerCase();
            let timeText = timeElement.textContent.trim();

            const allowedPrayers = [
              "fajr",
              "zuhr",
              "dhuhr",
              "asr",
              "maghrib",
              "isha",
            ];

            if (allowedPrayers.includes(prayerName)) {
              // Nettoyer et reformater le temps
              timeText = timeText.replace(/\s+/g, "");

              const regex = /^(\d{1,2})(\d{2})(AM|PM)?$/i;
              const match = timeText.match(regex);

              if (match) {
                let hours = parseInt(match[1], 10);
                const minutes = match[2];
                const period = match[3] ? match[3].toUpperCase() : "";

                if (period === "PM" && hours < 12) hours += 12;
                if (period === "AM" && hours === 12) hours = 0;

                prayerTimes[prayerName] = `${hours}:${minutes}`;
              } else {
                // Essayer d'autres patterns
                timeText = timeText.replace(/[^0-9]/g, "");
                if (timeText.length === 3 || timeText.length === 4) {
                  const hours = parseInt(
                    timeText.slice(0, timeText.length - 2),
                    10
                  );
                  const minutes = timeText.slice(-2);
                  prayerTimes[prayerName] = `${hours}:${minutes}`;
                }
              }
            }
          }
        });
      }

      return prayerTimes;
    });

    console.log("Données brutes extraites:", times);

    // Vérifier si nous avons des données
    if (!times || Object.keys(times).length === 0) {
      throw new Error("Aucune donnée extraite de l'iframe");
    }

    console.log("Normalisation des données...");

    // Normalisation des temps
    const normalizedTimes = {};
    for (let [prayer, time] of Object.entries(times)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      if (prayer && time) {
        const normalizedTime = normalizeTime(time);
        if (normalizedTime) {
          normalizedTimes[prayer] = normalizedTime;
        }
      }
    }

    const result = {
      source: "Aisha Mosque Walsall",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);

    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
});

module.exports = scrapeAishaMosque;
