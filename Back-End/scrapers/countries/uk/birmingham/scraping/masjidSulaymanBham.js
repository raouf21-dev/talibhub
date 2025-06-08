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
 * SCRAPER OPTIMISÉ - scrapeMasjidSulayman
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
const scrapeMasjidSulayman = createOptimizedScraper(async (page) => {

    await page.goto("https://masjidsulayman.co.uk/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForSelector("table.customStyles", { timeout: 15000 });

    console.log("Extraction des données...");

    // Approche directe et explicite basée sur la structure réelle observée
    const exactTimes = await page.evaluate(() => {
      // Trouver la table principale
      const table = document.querySelector("table.customStyles");
      if (!table) {
        return null;
      }

      const rows = Array.from(table.querySelectorAll("tr"));

      // Trouver la ligne des en-têtes (généralement ligne 1)
      let headerRow = null;
      let jamatRow = null;

      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll("th, td"));
        const cellTexts = cells.map((cell) =>
          cell.textContent.trim().toLowerCase()
        );

        // Identifier la ligne d'en-têtes
        if (cellTexts.includes("prayer") || cellTexts.includes("fajr")) {
          headerRow = row;
        }

        // Identifier la ligne Jamat
        if (cellTexts.includes("jamat")) {
          jamatRow = row;
        }
      }

      if (!headerRow || !jamatRow) {
        console.log("Headers ou Jamat row non trouvées");
        return null;
      }

      // Extraire les en-têtes et les horaires
      const headers = Array.from(headerRow.querySelectorAll("th, td")).map(
        (cell) => cell.textContent.trim().toLowerCase()
      );

      const jamatCells = Array.from(jamatRow.querySelectorAll("th, td")).map(
        (cell) => cell.textContent.trim()
      );

      console.log("Headers trouvés:", headers);
      console.log("Cellules Jamat:", jamatCells);

      // Structure observée: [Prayer, Fajr, Sunrise, Zuhr, Asr, Maghrib, Isha, Zawal]
      // Jamat row: [Jamat, 4:00 am, 1:45 pm, 7:00 pm, 9:24 pm, 10:45 pm]
      // Il manque des correspondances - on va mapper par position connue

      const prayerTimes = {};

      // Mapping basé sur les positions observées dans la vraie structure
      // Les cellules Jamat commencent à l'index 1 (après "Jamat")
      if (jamatCells.length >= 6) {
        // Position 1: Fajr
        if (jamatCells[1] && jamatCells[1] !== "-") {
          prayerTimes.fajr = jamatCells[1];
        }

        // Position 2: On ignore (Sunrise n'est pas dans Jamat)

        // Position 2: Zuhr (correspond à la position 2 dans jamatCells)
        if (jamatCells[2] && jamatCells[2] !== "-") {
          prayerTimes.dhuhr = jamatCells[2];
        }

        // Position 3: Asr
        if (jamatCells[3] && jamatCells[3] !== "-") {
          prayerTimes.asr = jamatCells[3];
        }

        // Position 4: Maghrib
        if (jamatCells[4] && jamatCells[4] !== "-") {
          prayerTimes.maghrib = jamatCells[4];
        }

        // Position 5: Isha
        if (jamatCells[5] && jamatCells[5] !== "-") {
          prayerTimes.isha = jamatCells[5];
        }
      }

      return prayerTimes;
    });

    console.log("Données brutes extraites:", exactTimes);

    // Si l'extraction directe échoue, utiliser méthode de fallback améliorée
    let rawTimes = exactTimes;
    if (!exactTimes || Object.keys(exactTimes).length < 3) {
      console.log("Extraction principale échouée, tentative de fallback...");

      // Méthode de fallback avec analyse plus flexible
      rawTimes = await page.evaluate(() => {
        const prayerTimes = {};
        const bodyText = document.body.innerText;

        // Patterns regex pour extraire les horaires depuis le texte
        const timePattern = /(\d{1,2}:\d{2}\s*(am|pm))/gi;
        const timeMatches = bodyText.match(timePattern);

        if (timeMatches && timeMatches.length >= 5) {
          // Supposer que les horaires sont dans l'ordre standard des prières
          const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

          // Filtrer les horaires qui semblent être des prières (pas des heures actuelles)
          const validTimes = timeMatches.filter((time) => {
            const hour = parseInt(time.split(":")[0]);
            const isPM = time.toLowerCase().includes("pm");
            const isAM = time.toLowerCase().includes("am");

            // Filtrer les heures qui ne sont pas des prières probables
            if (isAM && hour >= 2 && hour <= 6) return true; // Fajr
            if (isPM && hour >= 1 && hour <= 2) return true; // Dhuhr
            if (isPM && hour >= 6 && hour <= 8) return true; // Asr/Maghrib
            if (isPM && hour >= 9 && hour <= 11) return true; // Isha

            return false;
          });

          // Mapper les horaires valides aux prières
          validTimes.slice(0, prayers.length).forEach((time, index) => {
            if (prayers[index]) {
              prayerTimes[prayers[index]] = time;
            }
          });
        }

        return prayerTimes;
      });
    }

    console.log("Données brutes extraites:", rawTimes);

    // Mapping explicite des noms de prières
    const standardizedTimes = {};

    // Conversion et normalisation silencieuse
    Object.entries(rawTimes).forEach(([key, value]) => {
      const standardName = prayerUtils.standardizePrayerName(key);
      if (standardName) {
        const normalizedTime = normalizeTime(value, standardName);
        if (normalizedTime) {
          standardizedTimes[standardName] = normalizedTime;
        }
      }
    });

    // Vérifier que toutes les prières requises sont présentes
    const requiredPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const finalTimes = {};

    // Création d'un objet ordonné avec validation explicite de chaque prière
    requiredPrayers.forEach((prayer) => {
      if (standardizedTimes[prayer]) {
        finalTimes[prayer] = standardizedTimes[prayer];
      }
    });

    // Ajouter les prières non-standards si elles existent
    for (const [key, value] of Object.entries(standardizedTimes)) {
      if (!requiredPrayers.includes(key)) {
        finalTimes[key] = value;
      }
    }

    // Vérifier si nous avons au moins une prière valide
    const hasAtLeastOnePrayer = Object.keys(finalTimes).length > 0;
    if (!hasAtLeastOnePrayer) {
      throw new Error("Aucune prière valide trouvée pour Masjid Sulayman");
    }

    // Construction du résultat final
    const result = {
      source: "Sulayman bin Dawud Birmingham",
      date: dateUtils.getUKDate(),
      times: finalTimes,
    };

    console.log("Normalisation des données...");
    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);

    return standardizedResult;
});

module.exports = scrapeMasjidSulayman;
