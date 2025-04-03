// Back-End/scrapers/birmingham/masjidAs-SunnahAn-NabawiyyahBham.js

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { executablePath } = require("puppeteer");
const {
  normalizeTime,
  dateUtils,
  prayerUtils,
  userAgents,
} = require("../scraperUtils");
const humanBehavior = require("../humanBehaviorUtils");

const stealth = StealthPlugin();
stealth.enabledEvasions.delete("webgl.vendor");
stealth.enabledEvasions.delete("webgl.renderer");
puppeteer.use(stealth);

const scrapeMasjidAsSunnah = async () => {
  let browser;
  let page;
  let frame;

  try {
    console.log("Démarrage du scraping Masjid As-Sunnah An-Nabawiyyah...");

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
      ignoreHTTPSErrors: true,
      executablePath: await executablePath(),
    });

    page = await browser.newPage();
    await humanBehavior.setupPageOptimized(page);
    await page.setViewport({ width: 1920, height: 1080 });
    const randomUserAgent =
      userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (["image", "stylesheet", "font"].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log("Navigation en cours...");

    await page.goto(
      "https://www.astonmasjid.com",
      {
        waitUntil: "networkidle2",
        timeout: 30000,
      }
    );

    await Promise.all([
      humanBehavior.randomDelay(100, 200),
      humanBehavior.simulateScroll(page),
    ]);

    // Première approche: utiliser le tableau de la page
    let rawData = await page.evaluate(() => {
      const times = {};
      const prayerRows = document.querySelectorAll(
        "table.tw.widget-timming tbody tr"
      );

      prayerRows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 3) {
          let prayerName = cells[0].textContent.trim().toLowerCase();
          // Dans le cas où isha est orthographié esha
          if (prayerName === "esha") prayerName = "isha";
          // Si un du nom est zuhar, le standardiser en dhuhr
          if (prayerName === "zuhar") prayerName = "dhuhr";

          const startTime = cells[1].textContent.trim();
          const jamaahTime = cells[2].textContent.trim();

          // Prendre l'horaire de Jamaah comme priorité
          let time = jamaahTime || startTime;

          if (time && time !== "-" && time !== "N/A") {
            times[prayerName] = time;
          }
        }
      });

      return times;
    });

    console.log("Données brutes extraites (tableau):", rawData);

    // Si nous n'avons pas trouvé de données valides dans le tableau, essayons d'autres approches
    if (
      Object.keys(rawData).length === 0 ||
      !Object.values(rawData).some((v) => v)
    ) {
      console.log(
        "Aucune donnée trouvée dans le tableau, tentative avec iframe..."
      );

      // Vérifier s'il y a une iframe
      const hasIframe = await page.evaluate(() => {
        return document.querySelector("iframe") !== null;
      });

      if (hasIframe) {
        console.log("Iframe détectée, accès au contenu...");
        await page.waitForSelector("iframe", { timeout: 10000 });
        const frameHandle = await page.$("iframe");
        frame = await frameHandle.contentFrame();

        if (!frame) {
          console.log(
            "Impossible d'accéder au contenu de l'iframe, vérification d'un autre format..."
          );
        } else {
          // Extraction depuis l'iframe (style AishaMosque)
          rawData = await frame.evaluate(() => {
            const prayerTimes = {};
            const prayerItems = document.querySelectorAll(
              ".styles__Item-sc-1h272ay-1"
            );
            // Liste complète incluant toutes les variantes possibles
            const allowedPrayers = [
              "fajr",
              "dhuhr",
              "zuhr",
              "zuhar",
              "asr",
              "maghrib",
              "isha",
              "esha",
            ];

            prayerItems.forEach((item) => {
              try {
                // Tester plusieurs sélecteurs possibles pour le nom de prière
                let prayerNameElement =
                  item.querySelector(".title") ||
                  item.querySelector(".title.korolev") ||
                  item.querySelector('span[class^="styles-sc"]');

                if (!prayerNameElement) return;

                let prayerName = prayerNameElement.textContent
                  .trim()
                  .toLowerCase();

                if (!allowedPrayers.includes(prayerName)) return;

                // Tester plusieurs sélecteurs pour l'heure
                const timeElement =
                  item.querySelector(".time.mono") ||
                  item.querySelector(".time");

                if (!timeElement) return;

                let timeText = "";

                // Méthode 1: extraction directe du texte
                timeText = timeElement.textContent.trim();

                // Méthode 2: extraction via nœuds texte si méthode 1 échoue
                if (!timeText) {
                  timeElement.childNodes.forEach((node) => {
                    if (node.nodeType === Node.TEXT_NODE) {
                      timeText += node.textContent.trim();
                    }
                  });
                }

                if (!timeText) return;

                // Nettoyage et formatage du temps (combinaison des approches)
                // Approche 1: regex format hh:mmAM/PM
                const regex = /^(\d{1,2})[:\.]?(\d{2})?\s*(AM|PM)?$/i;
                const match = timeText.match(regex);

                if (match) {
                  let hours = parseInt(match[1], 10);
                  const minutes = match[2] || "00";
                  const period = match[3] ? match[3].toUpperCase() : "";

                  if (period === "PM" && hours < 12) hours += 12;
                  if (period === "AM" && hours === 12) hours = 0;

                  prayerTimes[prayerName] = `${hours}:${minutes}`;
                } else {
                  // Approche 2: extraction des chiffres uniquement
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
                    prayerTimes[prayerName] = formattedTime;
                  }
                }
              } catch (error) {
                console.error("Erreur lors du traitement de la prière:", error);
              }
            });

            return prayerTimes;
          });

          console.log("Données brutes extraites (iframe):", rawData);
        }
      } else {
        // Tentative d'extraction directe en imitant la structure d'aishaMosque
        console.log("Aucune iframe, tentative d'extraction directe...");

        rawData = await page.evaluate(() => {
          // Combinaison des deux approches
          const prayerTimes = {};
          try {
            // Tenter de trouver un tableau de prières avec une autre structure
            const tableRows = document.querySelectorAll("table tr");
            const allowedPrayers = [
              "fajr",
              "dhuhr",
              "zuhr",
              "zuhar",
              "asr",
              "maghrib",
              "isha",
              "esha",
            ];

            if (tableRows.length > 0) {
              tableRows.forEach((row) => {
                const cells = row.querySelectorAll("td, th");
                if (cells.length >= 2) {
                  let possiblePrayer = cells[0].textContent
                    .trim()
                    .toLowerCase();
                  let possibleTime = cells[cells.length - 1].textContent.trim();

                  // Nettoyer le nom de la prière
                  possiblePrayer = possiblePrayer
                    .replace(/prayer|salat|salah|namaz/gi, "")
                    .trim();

                  // Vérifier si c'est une prière valide
                  for (const prayer of allowedPrayers) {
                    if (possiblePrayer.includes(prayer)) {
                      if (
                        possibleTime &&
                        possibleTime !== "-" &&
                        possibleTime !== "N/A"
                      ) {
                        prayerTimes[prayer] = possibleTime;
                      }
                      break;
                    }
                  }
                }
              });
            }
          } catch (error) {
            console.error("Erreur lors de l'analyse du tableau:", error);
          }

          return prayerTimes;
        });

        console.log("Données brutes extraites (méthode alternative):", rawData);
      }
    }

    // Traitement final des données extraites
    console.log("Normalisation des données...");

    if (!rawData || Object.keys(rawData).length === 0) {
      throw new Error("Aucune donnée extraite");
    }

    const normalizedTimes = {};
    for (let [prayer, time] of Object.entries(rawData)) {
      // Standardiser le nom de la prière
      const standardPrayer = prayerUtils.standardizePrayerName(prayer);
      if (standardPrayer) {
        const normalizedTime = normalizeTime(time, standardPrayer);
        if (normalizedTime) {
          normalizedTimes[standardPrayer] = normalizedTime;
        }
      }
    }

    if (Object.keys(normalizedTimes).length === 0) {
      throw new Error(
        "Aucune heure de prière valide trouvée après normalisation"
      );
    }

    const result = {
      source: "Masjid As-Sunnah An-Nabawiyyah Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);
    return standardizedResult;
  } catch (error) {
    console.error(
      "Erreur lors du scraping de Masjid As-Sunnah An-Nabawiyyah:",
      error
    );
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("Navigateur fermé");
    }
  }
};

module.exports = scrapeMasjidAsSunnah;
