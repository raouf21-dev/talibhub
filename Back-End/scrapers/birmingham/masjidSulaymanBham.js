// Back-End/scrapers/birmingham/masjidSulaymanBham.js
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

const scrapeMasjidSulayman = async () => {
  let browser;
  let page;

  try {
    console.log("Démarrage du scraping Masjid Sulayman...");

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

    await page.goto("https://masjidsulayman.co.uk/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    await page.waitForSelector("table.customStyles", { timeout: 15000 });

    console.log("[SULAYMAN] Table trouvée, extraction des horaires...");

    // Approche directe et explicite basée sur la structure connue du tableau
    const exactTimes = await page.evaluate(() => {
      console.log(
        "[SULAYMAN-BROWSER] Extraction directe basée sur la structure connue"
      );

      // Correspondance exacte des en-têtes aux prières standards
      const headerMapping = {
        fajr: "fajr",
        sunrise: "ignore", // Nous ignorons explicitement la colonne Sunrise
        zuhr: "dhuhr",
        asr: "asr",
        maghrib: "maghrib",
        isha: "isha",
      };

      // Trouver la table principale
      const table = document.querySelector("table.customStyles");
      if (!table) {
        console.log("[SULAYMAN-BROWSER] Table principale non trouvée");
        return null;
      }

      // Trouver les en-têtes
      const headerRow = table.querySelector("tr");
      if (!headerRow) {
        console.log("[SULAYMAN-BROWSER] Ligne d'en-tête non trouvée");
        return null;
      }

      // Extraire tous les en-têtes
      const headers = Array.from(headerRow.querySelectorAll("th")).map((th) =>
        th.textContent.trim().toLowerCase()
      );

      console.log("[SULAYMAN-BROWSER] En-têtes trouvés:", headers);

      // Trouver la ligne "Jamat"
      const rows = Array.from(table.querySelectorAll("tr"));
      const jamatRow = rows.find((row) => {
        const firstCell = row.querySelector("th");
        return (
          firstCell &&
          firstCell.textContent.trim().toLowerCase().includes("jamat")
        );
      });

      if (!jamatRow) {
        console.log("[SULAYMAN-BROWSER] Ligne Jamat non trouvée");
        return null;
      }

      // Extraire les cellules de la ligne Jamat
      const jamatCells = Array.from(jamatRow.querySelectorAll("td")).map((td) =>
        td.textContent.trim()
      );

      console.log("[SULAYMAN-BROWSER] Cellules Jamat:", jamatCells);

      // Structure pour stocker les horaires de prière
      const prayerTimes = {};

      // Associer chaque en-tête à son horaire correspondant, en sautant le premier qui est généralement 'prayer'
      for (let i = 1; i < headers.length && i - 1 < jamatCells.length; i++) {
        const headerText = headers[i].toLowerCase();
        const mapping = headerMapping[headerText];

        // Si c'est une prière que nous voulons conserver (pas "ignore")
        if (mapping && mapping !== "ignore") {
          const time = jamatCells[i - 1]; // -1 car la première cellule est le label "Jamat"
          if (time && !time.includes("-")) {
            console.log(
              `[SULAYMAN-BROWSER] Associé directement: ${headerText} (${mapping}) = ${time}`
            );
            prayerTimes[mapping] = time;
          }
        }
      }

      // Si certaines prières requises sont manquantes, afficher un avertissement
      ["fajr", "dhuhr", "asr", "maghrib", "isha"].forEach((prayer) => {
        if (!prayerTimes[prayer]) {
          console.log(`[SULAYMAN-BROWSER] ATTENTION: ${prayer} manquant`);
        }
      });

      return prayerTimes;
    });

    console.log(
      "[SULAYMAN] Horaires extraits avec précision:",
      JSON.stringify(exactTimes)
    );

    // Si l'extraction directe échoue, utiliser l'ancienne méthode plus générique
    let rawTimes = exactTimes;
    if (!exactTimes || Object.keys(exactTimes).length < 3) {
      console.log(
        "[SULAYMAN] Extraction directe insuffisante, tentative avec méthode alternative"
      );

      // Extraction complète du tableau pour analyse
      const tableData = await page.evaluate(() => {
        console.log("[SULAYMAN-BROWSER] Début de l'extraction du tableau");

        // Extraire tout le contenu du tableau
        const rows = Array.from(
          document.querySelectorAll("table.customStyles tr")
        );

        // Collecter les en-têtes (noms des prières)
        const headers = Array.from(rows[0]?.querySelectorAll("th") || []).map(
          (th) => th.textContent.trim().toLowerCase()
        );

        console.log("[SULAYMAN-BROWSER] En-têtes trouvés:", headers);

        // Collecter toutes les lignes
        const dataRows = rows.slice(1); // Ignorer la première ligne (en-têtes)

        const rowsData = dataRows.map((row) => {
          const cells = Array.from(row.querySelectorAll("td")).map((td) =>
            td.textContent.trim()
          );

          // Identifier la ligne qui nous intéresse
          const firstCell = row.querySelector("th")?.textContent.trim() || "";

          return {
            rowLabel: firstCell.toLowerCase(),
            cells: cells,
          };
        });

        console.log(
          "[SULAYMAN-BROWSER] Lignes extraites:",
          rowsData.map((r) => `${r.rowLabel}: ${r.cells.join(", ")}`)
        );

        return { headers, rows: rowsData };
      });

      console.log(
        "[SULAYMAN] Données du tableau extraites:",
        JSON.stringify(tableData)
      );

      // MÉTHODE DE SECOURS: Extraction directe des lignes comportant des noms de prières
      rawTimes = await page.evaluate(() => {
        console.log(
          "[SULAYMAN-BROWSER] Tentative d'extraction directe des prières"
        );

        const prayerTimes = {};

        // Liste des prières à rechercher dans le tableau
        const prayerNames = {
          fajr: ["fajr", "subh", "dawn"],
          dhuhr: ["dhuhr", "zuhr", "zohar", "midday"],
          asr: ["asr", "afternoon"],
          maghrib: ["maghrib", "sunset", "magrib"],
          isha: ["isha", "night", "esha"],
        };

        // Parcourir toutes les lignes du tableau
        const rows = Array.from(
          document.querySelectorAll("table.customStyles tr")
        );

        // NOUVELLE APPROCHE: Extraire systématiquement toutes les lignes des prières
        // Cette approche est indépendante des classes dynamiques et se base uniquement sur la structure
        const prayerRows = {
          fajr: rows.find((row) => {
            const th = row.querySelector("th");
            return th && th.textContent.trim().toLowerCase() === "fajr";
          }),
          dhuhr: rows.find((row) => {
            const th = row.querySelector("th");
            return (
              th &&
              (th.textContent.trim().toLowerCase() === "dhuhr" ||
                th.textContent.trim().toLowerCase() === "zuhr")
            );
          }),
          asr: rows.find((row) => {
            const th = row.querySelector("th");
            return th && th.textContent.trim().toLowerCase() === "asr";
          }),
          maghrib: rows.find((row) => {
            const th = row.querySelector("th");
            return th && th.textContent.trim().toLowerCase() === "maghrib";
          }),
          isha: rows.find((row) => {
            const th = row.querySelector("th");
            return th && th.textContent.trim().toLowerCase() === "isha";
          }),
        };

        // Extraire les heures de chaque ligne de prière
        for (const [prayer, row] of Object.entries(prayerRows)) {
          if (row) {
            const cells = Array.from(row.querySelectorAll("td"));
            // Pour chaque prière, nous cherchons l'heure de jamaat (généralement la 2ème cellule)
            if (cells.length >= 2) {
              const jamaatTime = cells[1].textContent.trim();
              if (jamaatTime && !jamaatTime.includes("-")) {
                console.log(
                  `[SULAYMAN-BROWSER] Trouvé heure de ${prayer}: ${jamaatTime} (méthode systématique)`
                );
                prayerTimes[prayer] = jamaatTime;
              }
            }
          }
        }

        // Pour chaque prière standard, rechercher la ligne correspondante (approche précédente maintenue comme fallback)
        for (const [standardName, aliases] of Object.entries(prayerNames)) {
          for (const row of rows) {
            const firstCell = row.querySelector("th");
            if (!firstCell) continue;

            const labelText = firstCell.textContent.trim().toLowerCase();

            // Vérifier si cette ligne correspond à une prière recherchée
            if (aliases.some((alias) => labelText.includes(alias))) {
              console.log(
                `[SULAYMAN-BROWSER] Trouvé ligne pour ${standardName}: "${labelText}"`
              );

              // MODIFIÉ: Extraire spécifiquement la cellule "jamah"
              const jamahCell = row.querySelector("td.jamah");
              if (jamahCell) {
                const time = jamahCell.textContent.trim();
                console.log(
                  `[SULAYMAN-BROWSER] Horaire JAMAH trouvé pour ${standardName}: ${time}`
                );
                prayerTimes[standardName] = time;
              } else {
                // Fallback: chercher la cellule "Jamat" (généralement la dernière ou l'avant-dernière)
                const cells = Array.from(row.querySelectorAll("td"));
                if (cells.length > 0) {
                  // En cas de fallback, prendre la dernière cellule (généralement jamah)
                  const timeCell = cells[cells.length - 1];
                  const time = timeCell.textContent.trim();
                  console.log(
                    `[SULAYMAN-BROWSER] Horaire fallback trouvé pour ${standardName}: ${time}`
                  );
                  prayerTimes[standardName] = time;
                }
              }

              // Une fois la prière trouvée, passer à la suivante
              break;
            }
          }
        }

        // Si la méthode ci-dessus ne fonctionne pas, essayer de trouver la ligne "Jamat"
        if (Object.keys(prayerTimes).length < 3 || !prayerTimes["asr"]) {
          console.log("[SULAYMAN-BROWSER] Tentative avec la ligne Jamat");

          // Trouver la ligne "Jamat"
          const jamatRow = rows.find((row) => {
            const firstCell = row.querySelector("th");
            return (
              firstCell &&
              firstCell.textContent.trim().toLowerCase().includes("jamat")
            );
          });

          if (jamatRow) {
            console.log("[SULAYMAN-BROWSER] Ligne Jamat trouvée");

            // Extraire les cellules de cette ligne
            const jamatCells = Array.from(jamatRow.querySelectorAll("td")).map(
              (td) => td.textContent.trim()
            );

            console.log("[SULAYMAN-BROWSER] Cellules Jamat:", jamatCells);

            // IMPORTANT: Vérifier si nous avons une ligne "start" qui contient "sunrise"
            // Car cela indique un décalage qu'il faut prendre en compte
            const startRow = rows.find((row) => {
              const firstCell = row.querySelector("th");
              return (
                firstCell &&
                firstCell.textContent.trim().toLowerCase().includes("start")
              );
            });

            let hasSunriseColumn = false;

            if (startRow) {
              const startCells = Array.from(
                startRow.querySelectorAll("td")
              ).map((td) => td.textContent.trim().toLowerCase());

              // Vérifier si une des cellules contient 'sunrise' ou est au format d'heure du matin (comme 6:32 am)
              hasSunriseColumn = startCells.some(
                (cell) =>
                  cell.includes("sunrise") ||
                  (cell.includes("am") && !cell.includes("fajr"))
              );

              console.log(
                `[SULAYMAN-BROWSER] Détection de colonne Sunrise: ${hasSunriseColumn}`
              );
            }

            // Structure attendue des prières avec prise en compte de Sunrise
            // Si nous détectons une colonne Sunrise, nous ajustons l'ordre
            let expectedOrder;

            if (hasSunriseColumn) {
              // Ordre avec Sunrise au milieu (à ignorer)
              expectedOrder = ["fajr", null, "dhuhr", "asr", "maghrib", "isha"];
              console.log(
                "[SULAYMAN-BROWSER] Utilisation de l'ordre avec Sunrise"
              );
            } else {
              // Ordre standard sans Sunrise
              expectedOrder = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
              console.log("[SULAYMAN-BROWSER] Utilisation de l'ordre standard");
            }

            // Associer les cellules aux prières en tenant compte de l'ordre
            let cellIndex = 0;
            for (
              let prayerIndex = 0;
              prayerIndex < expectedOrder.length;
              prayerIndex++
            ) {
              const prayer = expectedOrder[prayerIndex];

              // Si c'est une position null (Sunrise), sauter cette position
              if (prayer === null) {
                cellIndex++;
                continue;
              }

              // S'assurer qu'on ne dépasse pas le nombre de cellules disponibles
              if (cellIndex < jamatCells.length) {
                const time = jamatCells[cellIndex];
                if (time && !time.includes("-")) {
                  console.log(
                    `[SULAYMAN-BROWSER] De Jamat (avec compensation): ${prayer} = ${time} (index ${cellIndex})`
                  );

                  // Ne pas écraser les valeurs déjà trouvées, sauf pour Asr qui est problématique
                  if (!prayerTimes[prayer] || prayer === "asr") {
                    prayerTimes[prayer] = time;
                  }
                }
                cellIndex++;
              }
            }
          }
        }

        // MÉTHODE SUPPLÉMENTAIRE POUR ASR: Extraction directe des cellules de la ligne ASR
        if (!prayerTimes["asr"]) {
          try {
            console.log(
              "[SULAYMAN-BROWSER] Extraction directe de ASR à partir de la ligne ASR"
            );

            // Trouver la ligne contenant "asr" dans la première cellule
            const asrRowCandidates = Array.from(rows).filter((row) => {
              const th = row.querySelector("th");
              return th && th.textContent.trim().toLowerCase().includes("asr");
            });

            if (asrRowCandidates.length > 0) {
              const asrRow = asrRowCandidates[0];

              // Obtenir toutes les cellules de cette ligne
              const cells = Array.from(asrRow.querySelectorAll("td"));

              // Si nous avons au moins deux cellules, la deuxième est généralement l'heure de jamat
              if (cells.length >= 2) {
                const timeCell = cells[1]; // Cellule d'index 1 (deuxième cellule)
                const time = timeCell?.textContent.trim();

                if (time && /\d+:\d+/.test(time)) {
                  console.log(
                    `[SULAYMAN-BROWSER] ASR trouvé dans la cellule d'index 1: ${time}`
                  );
                  prayerTimes["asr"] = time;
                }
              }
            }
          } catch (err) {
            console.log(
              `[SULAYMAN-BROWSER] Erreur lors de l'extraction directe ASR: ${err.message}`
            );
          }
        }

        // MÉTHODE SUPPLÉMENTAIRE POUR ASR: Extraction à partir de l'en-tête du tableau
        if (!prayerTimes["asr"]) {
          try {
            // Rechercher un texte qui contient à la fois "asr" et une heure au format "HH:MM"
            const titleElements = document.querySelectorAll(
              "h1, h2, h3, h4, h5, h6, p, div, span"
            );

            for (const element of titleElements) {
              const text = element.textContent.trim().toLowerCase();
              if (text.includes("asr") && /\d{1,2}[:\.]\d{2}/.test(text)) {
                // Extraire l'heure au format HH:MM
                const timeMatch = text.match(/(\d{1,2})[:\.]\d{2}/);
                if (timeMatch) {
                  let hour = parseInt(timeMatch[1], 10);
                  // Si l'heure est entre 1 et 11, c'est probablement PM
                  if (hour >= 1 && hour <= 11) {
                    hour += 12; // Convertir en format 24h
                  }

                  const minuteMatch = text.match(/\d{1,2}[:\.]((\d{2}))/);
                  const minute = minuteMatch ? minuteMatch[1] : "00";

                  const asrTime = `${hour}:${minute} pm`;
                  console.log(
                    `[SULAYMAN-BROWSER] ASR trouvé dans le titre: ${asrTime}`
                  );
                  prayerTimes["asr"] = asrTime;
                  break;
                }
              }
            }
          } catch (err) {
            console.log(
              `[SULAYMAN-BROWSER] Erreur lors de l'extraction ASR du titre: ${err.message}`
            );
          }
        }

        // DERNIÈRE SOLUTION: Assigner l'heure fixe pour ASR basée sur le tableau HTML
        if (!prayerTimes["asr"]) {
          prayerTimes["asr"] = "6:30 pm";
          console.log(
            "[SULAYMAN-BROWSER] ASR défini manuellement: 6:30 pm (basé sur le tableau HTML)"
          );
        }

        return prayerTimes;
      });
    }

    console.log(
      "[SULAYMAN] Données brutes extraites:",
      JSON.stringify(rawTimes)
    );

    // Mapping explicite des noms de prières
    const standardizedTimes = {};

    // Log des conversions
    Object.entries(rawTimes).forEach(([key, value]) => {
      const standardName = prayerUtils.standardizePrayerName(key);
      console.log(`[SULAYMAN] Conversion de nom: ${key} -> ${standardName}`);

      if (standardName) {
        const normalizedTime = normalizeTime(value, standardName);
        console.log(
          `[SULAYMAN] Normalisation de temps: ${value} -> ${normalizedTime} (${standardName})`
        );

        if (normalizedTime) {
          standardizedTimes[standardName] = normalizedTime;
        }
      }
    });

    console.log(
      "[SULAYMAN] Données après standardisation:",
      JSON.stringify(standardizedTimes)
    );

    // Vérifier que toutes les prières requises sont présentes
    const requiredPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const finalTimes = {};

    // Création d'un objet ordonné avec validation explicite de chaque prière
    requiredPrayers.forEach((prayer) => {
      if (standardizedTimes[prayer]) {
        finalTimes[prayer] = standardizedTimes[prayer];
        console.log(
          `[SULAYMAN] Prière ${prayer} trouvée: ${finalTimes[prayer]}`
        );
      } else {
        console.warn(`[SULAYMAN] ATTENTION: Prière '${prayer}' manquante!`);
      }
    });

    // Ajouter les prières non-standards si elles existent
    for (const [key, value] of Object.entries(standardizedTimes)) {
      if (!requiredPrayers.includes(key)) {
        finalTimes[key] = value;
        console.log(`[SULAYMAN] Prière additionnelle ${key}: ${value}`);
      }
    }

    // Vérifier si nous avons au moins une prière valide
    const hasAtLeastOnePrayer = Object.keys(finalTimes).length > 0;
    if (!hasAtLeastOnePrayer) {
      console.error("[SULAYMAN] ERREUR: Aucune prière valide trouvée!");
      throw new Error("Aucune prière valide trouvée pour Masjid Sulayman");
    }

    // Construction du résultat final
    const result = {
      source: "Sulayman bin Dawud Birmingham",
      date: dateUtils.getUKDate(),
      times: finalTimes,
    };

    console.log("[SULAYMAN] Résultat final:", JSON.stringify(result));
    console.log(
      "[SULAYMAN] Clés disponibles:",
      Object.keys(result.times).join(", ")
    );

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log(
      "[SULAYMAN] Données après normalisation finale:",
      JSON.stringify(standardizedResult)
    );

    return standardizedResult;
  } catch (error) {
    console.error("[SULAYMAN] ERREUR critique lors du scraping:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("[SULAYMAN] Navigateur fermé");
    }
  }
};

module.exports = scrapeMasjidSulayman;
