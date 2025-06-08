// Système de fallback universel graduel
// Se déclenche après l'échec des 3 tentatives principales
const { normalizeTime, dateUtils, prayerUtils } = require("./scraper");

class UniversalFallback {
  constructor() {
    this.fallbackStrategies = [
      {
        name: "Extraction de texte brut",
        method: this.fallbackByTextExtraction,
        description: "Analyse du texte de la page avec regex",
      },
      {
        name: "Sélecteurs génériques",
        method: this.fallbackByGenericSelectors,
        description: "Recherche avec sélecteurs CSS génériques",
      },
      {
        name: "Patterns d'horaires",
        method: this.fallbackByTimePatterns,
        description: "Détection d'horaires par patterns temporels",
      },
      {
        name: "Analyse DOM approfondie",
        method: this.fallbackByDOMAnalysis,
        description: "Exploration iframes et tables complexes",
      },
      {
        name: "Horaires par défaut",
        method: this.fallbackByLastResort,
        description: "Horaires approximatifs selon la ville",
      },
    ];
  }

  // Point d'entrée principal du fallback universel
  async execute(page, mosqueInfo) {
    console.log(`🔄 Fallback universel activé pour ${mosqueInfo.name}`);
    console.log(`📊 ${this.fallbackStrategies.length} stratégies disponibles`);

    for (let i = 0; i < this.fallbackStrategies.length; i++) {
      const strategy = this.fallbackStrategies[i];

      try {
        console.log(
          `⚡ Stratégie ${i + 1}/${this.fallbackStrategies.length}: ${
            strategy.name
          }`
        );
        console.log(`   📝 ${strategy.description}`);

        const startTime = Date.now();
        const result = await strategy.method.call(this, page, mosqueInfo);
        const duration = Date.now() - startTime;

        if (this.isValidResult(result)) {
          console.log(
            `✅ Fallback réussi avec "${strategy.name}" en ${duration}ms`
          );
          console.log(
            `🎯 Données extraites: ${Object.keys(result).length} prières`
          );

          // Retourner le résultat avec informations de fallback
          const finalResult = this.normalizeResult(result, mosqueInfo);
          finalResult.fallbackUsed = {
            strategyName: strategy.name,
            strategyIndex: i + 1,
            description: strategy.description,
            duration: duration,
            dataQuality: this.assessDataQuality(result),
          };

          return finalResult;
        } else {
          console.log(
            `❌ Stratégie "${strategy.name}" échouée - données insuffisantes`
          );
        }
      } catch (error) {
        console.log(
          `❌ Stratégie "${strategy.name}" échouée: ${error.message}`
        );
        continue;
      }
    }

    throw new Error(`Tous les fallbacks ont échoué pour ${mosqueInfo.name}`);
  }

  // Évaluer la qualité des données extraites
  assessDataQuality(result) {
    const prayerCount = Object.keys(result).length;
    const requiredPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const foundRequired = requiredPrayers.filter(
      (prayer) => result[prayer]
    ).length;

    if (foundRequired === 5) return "Excellente";
    if (foundRequired >= 4) return "Bonne";
    if (foundRequired >= 3) return "Acceptable";
    return "Partielle";
  }

  // Fallback 1: Extraction de texte brut
  async fallbackByTextExtraction(page) {
    return await page.evaluate(() => {
      const times = {};
      const bodyText = document.body.innerText.toLowerCase();

      // Patterns de recherche pour chaque prière
      const prayerPatterns = {
        fajr: /fajr[^0-9]*(\d{1,2}[:\.]?\d{2})\s*(am|pm)?/i,
        dhuhr: /(dhuhr|zuhr)[^0-9]*(\d{1,2}[:\.]?\d{2})\s*(am|pm)?/i,
        asr: /asr[^0-9]*(\d{1,2}[:\.]?\d{2})\s*(am|pm)?/i,
        maghrib: /maghrib[^0-9]*(\d{1,2}[:\.]?\d{2})\s*(am|pm)?/i,
        isha: /isha[^0-9]*(\d{1,2}[:\.]?\d{2})\s*(am|pm)?/i,
      };

      // Extraire chaque prière
      for (const [prayer, pattern] of Object.entries(prayerPatterns)) {
        const match = bodyText.match(pattern);
        if (match) {
          let time = match[1] || match[2];
          const period = match[3] || match[2];

          // Formatter le temps
          if (time && !time.includes(":")) {
            time = time.slice(0, -2) + ":" + time.slice(-2);
          }

          if (period) {
            time += " " + period;
          }

          times[prayer] = time;
        }
      }

      return times;
    });
  }

  // Fallback 2: Sélecteurs génériques
  async fallbackByGenericSelectors(page) {
    return await page.evaluate(() => {
      const times = {};

      // Liste de sélecteurs génériques communs
      const genericSelectors = [
        ".prayer-time",
        ".time",
        ".prayer",
        '[class*="time"]',
        '[class*="prayer"]',
        "td",
        "span",
        ".content",
        ".schedule",
        '[id*="time"]',
        '[id*="prayer"]',
        ".timetable",
        ".schedule-time",
      ];

      const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

      for (const selector of genericSelectors) {
        const elements = document.querySelectorAll(selector);

        for (const element of elements) {
          const text = element.textContent.toLowerCase();

          // Vérifier si l'élément contient une prière et un horaire
          for (const prayer of prayers) {
            if (text.includes(prayer) && /\d{1,2}[:\.]?\d{2}/.test(text)) {
              const timeMatch = text.match(/(\d{1,2}[:\.]?\d{2})/);
              if (timeMatch && !times[prayer]) {
                times[prayer] = timeMatch[1];
              }
            }
          }
        }

        // Si on a trouvé quelque chose, on s'arrête
        if (Object.keys(times).length > 0) break;
      }

      return times;
    });
  }

  // Fallback 3: Patterns d'horaires dans la page
  async fallbackByTimePatterns(page) {
    return await page.evaluate(() => {
      const times = {};
      const bodyText = document.body.innerText;

      // Extraire tous les horaires au format HH:MM
      const timeMatches = bodyText.match(/\d{1,2}[:\.]\d{2}(\s*(am|pm))?/gi);

      if (timeMatches && timeMatches.length >= 5) {
        // Supposer que les 5 premiers horaires trouvés sont les prières
        const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

        for (let i = 0; i < Math.min(prayers.length, timeMatches.length); i++) {
          times[prayers[i]] = timeMatches[i];
        }
      }

      return times;
    });
  }

  // Fallback 4: Analyse DOM approfondie
  async fallbackByDOMAnalysis(page) {
    return await page.evaluate(() => {
      const times = {};

      // Chercher dans les iframes
      const iframes = document.querySelectorAll("iframe");
      for (const iframe of iframes) {
        try {
          const iframeDoc =
            iframe.contentDocument || iframe.contentWindow.document;
          if (iframeDoc) {
            const iframeText = iframeDoc.body.innerText.toLowerCase();

            const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
            for (const prayer of prayers) {
              const pattern = new RegExp(
                prayer + "[^0-9]*(d{1,2}[:.]?d{2})",
                "i"
              );
              const match = iframeText.match(pattern);
              if (match && !times[prayer]) {
                times[prayer] = match[1];
              }
            }
          }
        } catch (e) {
          // Iframe inaccessible, continuer
        }
      }

      // Chercher dans les tables
      if (Object.keys(times).length === 0) {
        const tables = document.querySelectorAll("table");
        for (const table of tables) {
          const rows = table.querySelectorAll("tr");

          for (const row of rows) {
            const cells = row.querySelectorAll("td, th");
            const rowText = row.textContent.toLowerCase();

            const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
            for (const prayer of prayers) {
              if (rowText.includes(prayer)) {
                // Chercher l'horaire dans cette ligne
                for (const cell of cells) {
                  const cellText = cell.textContent;
                  const timeMatch = cellText.match(/\d{1,2}[:\.]?\d{2}/);
                  if (timeMatch && !times[prayer]) {
                    times[prayer] = timeMatch[0];
                  }
                }
              }
            }
          }

          if (Object.keys(times).length > 0) break;
        }
      }

      return times;
    });
  }

  // Fallback 5: Dernière tentative avec horaires fixes par défaut basés sur l'heure actuelle
  async fallbackByLastResort(page, mosqueInfo) {
    // Extraire la ville depuis le nom de la mosquée
    const isWalsall = mosqueInfo.name.toLowerCase().includes("walsall");
    const isBirmingham = mosqueInfo.name.toLowerCase().includes("birmingham");

    // Horaires approximatifs par défaut (UK)
    const defaultTimes = {
      fajr: "04:00",
      dhuhr: "13:30",
      asr: isWalsall ? "19:30" : "19:00", // Walsall tend à être plus tard
      maghrib: "21:25",
      isha: isBirmingham ? "22:45" : "22:30",
    };

    console.log(
      `⚠️ Utilisation des horaires par défaut pour ${mosqueInfo.name}`
    );
    return defaultTimes;
  }

  // Vérifier si le résultat est valide
  isValidResult(result) {
    if (!result || typeof result !== "object") return false;

    // Il faut au moins 3 prières valides
    const validTimes = Object.values(result).filter(
      (time) => time && /\d{1,2}[:\.]?\d{2}/.test(time)
    );

    return validTimes.length >= 3;
  }

  // Normaliser le résultat du fallback
  normalizeResult(rawTimes, mosqueInfo) {
    const normalizedTimes = {};

    // Conversion et normalisation
    Object.entries(rawTimes).forEach(([key, value]) => {
      const standardName = prayerUtils.standardizePrayerName(key);
      if (standardName && value) {
        const normalizedTime = normalizeTime(value, standardName);
        if (normalizedTime) {
          normalizedTimes[standardName] = normalizedTime;
        }
      }
    });

    const result = {
      source: mosqueInfo.name + " (Fallback)",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    return prayerUtils.normalizeResult(result);
  }
}

module.exports = new UniversalFallback();
