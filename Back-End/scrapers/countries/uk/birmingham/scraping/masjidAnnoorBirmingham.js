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
 * SCRAPER OPTIMISÉ - scrapeMasjidAnnoor
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
const scrapeMasjidAnnoor = createOptimizedScraper(async (page) => {

    console.log("Navigation en cours...");

    await page.goto("https://masjidannoorbirmingham.org/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Simulation de comportement humain sur la page principale
    await Promise.all([
      humanBehavior.randomDelay(100, 200),
      humanBehavior.simulateScroll(page),
    ]);

    // Vérifier si la page contient un iframe
    console.log("Recherche d'iframes sur la page...");
    const hasIframe = await page.evaluate(() => {
      return !!document.querySelector("iframe");
    });

    let rawData = {};

    if (hasIframe) {
      console.log("Iframe trouvé, tentative d'accès...");
      await page.waitForSelector("iframe", { timeout: 30000 });
      const frameHandle = await page.$("iframe");
      frame = await frameHandle.contentFrame();

      if (!frame) {
        throw new Error("Impossible d'accéder au contenu de l'iframe");
      }

      // Attendre que le contenu de l'iframe se charge
      try {
        await frame.waitForSelector(".styles__Item-sc-1h272ay-1", {
          timeout: 15000,
        });

        console.log("Extraction des horaires depuis l'iframe...");

        rawData = await frame.evaluate(() => {
          const times = {};
          const prayerItems = document.querySelectorAll(
            ".styles__Item-sc-1h272ay-1"
          );
          const allowedPrayers = [
            "fajr",
            "dhuhr",
            "zuhr",
            "asr",
            "maghrib",
            "isha",
          ];

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
      } catch (error) {
        console.log(
          "Sélecteur spécifique non trouvé dans l'iframe, tentative avec sélecteur alternatif..."
        );

        await frame.waitForSelector("div[class*='styles__Item']", {
          timeout: 15000,
        });

        rawData = await frame.evaluate(() => {
          const times = {};
          const prayerItems = document.querySelectorAll(
            "div[class*='styles__Item']"
          );
          const allowedPrayers = [
            "fajr",
            "dhuhr",
            "zuhr",
            "asr",
            "maghrib",
            "isha",
          ];

          prayerItems.forEach((item) => {
            try {
              // Chercher le nom de la prière (dans un span ou div avec 'title' dans la classe)
              const nameSpan = item.querySelector(
                "span[class*='styles-sc'], div[class*='title']"
              );
              if (!nameSpan) return;

              const prayerName = nameSpan.textContent.trim().toLowerCase();
              if (!allowedPrayers.includes(prayerName)) return;

              // Chercher l'élément qui contient l'heure (généralement avec classe 'time' ou 'mono')
              const timeElement = item.querySelector("div[class*='time']");
              if (!timeElement) return;

              let timeText = timeElement.textContent.trim();
              const cleanTime = timeText.replace(/[^\d]/g, "");

              // Formater l'heure selon la longueur
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
      }
    } else {
      // Recherche directe sur la page principale si pas d'iframe
      console.log("Aucun iframe trouvé, recherche sur la page principale...");

      try {
        await page.waitForSelector(
          "div[class*='styles__Wrapper'], div[class*='time'], div[class*='Prayer']",
          {
            timeout: 10000,
          }
        );

        rawData = await page.evaluate(() => {
          const times = {};
          const prayerNames = [
            "fajr",
            "dhuhr",
            "zuhr",
            "asr",
            "maghrib",
            "isha",
          ];

          // Recherche de textes contenant les noms de prières et des horaires à proximité
          prayerNames.forEach((prayer) => {
            // Rechercher tous les éléments contenant le nom de la prière
            const elements = Array.from(document.querySelectorAll("*")).filter(
              (el) => el.textContent.toLowerCase().includes(prayer)
            );

            for (const el of elements) {
              // Rechercher un horaire dans ce même élément ou dans ses éléments parents/enfants
              let timeContainer = el;
              let timeText = "";

              // Vérifier l'élément lui-même
              if (/\d{1,2}[:.\h]?\d{2}/.test(el.textContent)) {
                timeText = el.textContent;
              }
              // Vérifier les éléments frères
              else if (
                el.nextElementSibling &&
                /\d{1,2}[:.\h]?\d{2}/.test(el.nextElementSibling.textContent)
              ) {
                timeText = el.nextElementSibling.textContent;
              }
              // Vérifier le parent
              else if (el.parentElement) {
                const timeElements = Array.from(
                  el.parentElement.children
                ).filter((child) =>
                  /\d{1,2}[:.\h]?\d{2}/.test(child.textContent)
                );
                if (timeElements.length > 0) {
                  timeText = timeElements[0].textContent;
                }
              }

              if (timeText) {
                // Extraire l'heure du texte
                const timeMatch = timeText.match(/(\d{1,2})[:.\h]?(\d{2})/);
                if (timeMatch) {
                  times[prayer] = `${timeMatch[1].padStart(2, "0")}:${
                    timeMatch[2]
                  }`;
                  break; // Arrêter après avoir trouvé la première correspondance
                }

                // Alternative pour un format numérique simple
                const numMatch = timeText.match(/\d{3,4}/);
                if (numMatch) {
                  const timeStr = numMatch[0];
                  if (timeStr.length === 3) {
                    times[prayer] = `${timeStr[0]}:${timeStr.slice(1)}`;
                    break;
                  } else if (timeStr.length === 4) {
                    times[prayer] = `${timeStr.slice(0, 2)}:${timeStr.slice(
                      2
                    )}`;
                    break;
                  }
                }
              }
            }
          });

          return times;
        });
      } catch (error) {
        console.log(
          "Méthode alternative échouée, tentative avec analyse générale..."
        );

        // Méthode de secours: parcourir tous les éléments pour trouver tout texte qui ressemble à une heure
        rawData = await page.evaluate(() => {
          const times = {};
          const prayerNames = [
            "fajr",
            "dhuhr",
            "zuhr",
            "asr",
            "maghrib",
            "isha",
          ];
          const container = document.body.textContent.toLowerCase();

          prayerNames.forEach((prayer) => {
            const prayerIndex = container.indexOf(prayer);
            if (prayerIndex !== -1) {
              // Rechercher un texte qui ressemble à une heure dans les 50 caractères après le nom de la prière
              const contextAfter = container.substring(
                prayerIndex,
                prayerIndex + 50
              );
              const timeMatch = contextAfter.match(/(\d{1,2})[:\s.](\d{2})/);
              if (timeMatch) {
                times[prayer] = `${timeMatch[1].padStart(2, "0")}:${
                  timeMatch[2]
                }`;
              } else {
                // Format alternatif (nombres consécutifs)
                const numMatch = contextAfter.match(/\b(\d{3,4})\b/);
                if (numMatch) {
                  const timeStr = numMatch[1];
                  if (timeStr.length === 3) {
                    times[prayer] = `${timeStr[0]}:${timeStr.slice(1)}`;
                  } else if (timeStr.length === 4) {
                    times[prayer] = `${timeStr.slice(0, 2)}:${timeStr.slice(
                      2
                    )}`;
                  }
                }
              }
            }
          });

          return times;
        });
      }
    }

    // Si toujours pas de données, faire une capture d'écran pour analyse
    if (!rawData || Object.keys(rawData).length === 0) {
      console.log("Aucune donnée extraite, capture d'écran pour analyse...");
      throw new Error("Aucune donnée extraite de la page");
    }

    console.log("Données brutes extraites:", rawData);

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
      source: "Masjid An-noor Birmingham",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log("Données normalisées:", standardizedResult);

    return standardizedResult;
});

module.exports = scrapeMasjidAnnoor;
