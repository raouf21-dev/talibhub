// utils/scraper-template.js - Template pour refactoriser les scrapers avec pool centralisé

const { getBrowserManager } = require("./browser-manager");
const { normalizeTime, dateUtils, prayerUtils } = require("./scraper");
const humanBehavior = require("./human-behavior");

/**
 * Template pour refactoriser un scraper existant avec options avancées
 *
 * @param {Function} scrapingLogic - Logique de scraping spécifique (page déjà configurée)
 * @param {Object} options - Options avancées
 * @param {boolean} options.disableInterception - Désactiver l'interception (défaut: false)
 * @param {Function} options.requestHandler - Handler custom pour les requêtes
 * @param {boolean} options.enableJavaScript - Activer JavaScript (défaut: true)
 */
const createOptimizedScraper = (scrapingLogic, options = {}) => {
  return async () => {
    const browserManager = getBrowserManager();

    // ✅ CORRECTION : Gérer l'interception correctement
    const browserOptions = {
      enableInterception: !options.disableInterception, // Activé par défaut
      enableJavaScript: options.enableJavaScript !== false,
      ...options,
    };

    return await browserManager.executeWithBrowser(async (page) => {
      // ✅ CORRECTION : Configuration interception custom SEULEMENT si nécessaire
      if (
        options.requestHandler &&
        typeof options.requestHandler === "function"
      ) {
        // Désactiver l'interception du browser-manager et installer la custom
        await page.setRequestInterception(false); // Reset
        await page.removeAllListeners("request"); // Supprimer les handlers existants
        await page.setRequestInterception(true); // Réactiver
        page.on("request", options.requestHandler); // Handler custom
      }

      // ✅ Sinon, l'interception standard du browser-manager est déjà active

      // ✅ La page est automatiquement configurée par browser-manager :
      // - Viewport 1920x1080
      // - User agent aléatoire
      // - Comportement humain activé
      // - Interception des ressources (images, CSS, fonts)

      // Exécuter uniquement la logique métier spécifique
      return await scrapingLogic(page);
    }, browserOptions);
  };
};

/**
 * ✅ NOUVELLE FONCTION : Créer un scraper avec interception personnalisée
 */
const createScraperWithCustomInterception = (scrapingLogic, requestHandler) => {
  return createOptimizedScraper(scrapingLogic, {
    requestHandler: requestHandler,
  });
};

/**
 * ✅ NOUVELLE FONCTION : Créer un scraper sans interception (pour sites sensibles)
 */
const createScraperNoInterception = (scrapingLogic) => {
  return createOptimizedScraper(scrapingLogic, {
    disableInterception: true,
  });
};

/**
 * Helper pour obtenir la date d'aujourd'hui (format UK)
 */
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * ✅ EXEMPLE OPTIMISÉ : Aisha Mosque (code minimal grâce à la centralisation)
 */
const scrapeAishaMosqueOptimized = createOptimizedScraper(async (page) => {
  console.log("Navigation en cours...");
  await page.goto("https://www.aishamosque.org/", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  // ✅ Comportement humain automatique via browser-manager
  await Promise.all([
    humanBehavior.randomDelay(100, 200),
    humanBehavior.simulateScroll(page),
  ]);

  console.log("Accès à l'iframe...");
  await page.waitForSelector("iframe", { timeout: 30000 });
  const frameHandle = await page.$("iframe");
  const frame = await frameHandle.contentFrame();

  if (!frame) {
    throw new Error("Impossible d'accéder au contenu de l'iframe");
  }

  console.log("Extraction des horaires...");
  const times = await frame.evaluate(() => {
    const prayerTimes = {};
    const prayerPatterns = {
      fajr: /FAJR[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(AM|PM)/i,
      zuhr: /ZUHR[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(AM|PM)/i,
      asr: /ASR[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(AM|PM)/i,
      maghrib: /MAGHRIB[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(AM|PM)/i,
      isha: /ISHA[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(AM|PM)/i,
    };

    const allText = document.body.innerText;
    for (const [prayer, pattern] of Object.entries(prayerPatterns)) {
      const match = allText.match(pattern);
      if (match) {
        const hours = match[1];
        const minutes = match[2];
        const period = match[3];
        prayerTimes[prayer] = `${hours}:${minutes} ${period}`;
      }
    }
    return prayerTimes;
  });

  if (!times || Object.keys(times).length === 0) {
    throw new Error("Aucune donnée extraite de l'iframe");
  }

  console.log("Normalisation des données...");
  const normalizedTimes = {};
  for (const [prayer, time] of Object.entries(times)) {
    const mappedPrayer = prayer === "zuhr" ? "dhuhr" : prayer;
    normalizedTimes[mappedPrayer] = normalizeTime(time);
  }

  return {
    source: "Aisha Mosque Walsall",
    date: getTodayDate(),
    times: normalizedTimes,
  };
});

/**
 * Exemple simple pour tester le pool sans scraper complexe
 */
const simpleTestScraper = createOptimizedScraper(async (page) => {
  console.log("Test simple du pool de navigateurs...");
  await page.goto("about:blank", { timeout: 5000 });
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    source: "Test Pool",
    date: getTodayDate(),
    times: { test: "12:00" },
    poolUsed: true,
  };
});

/**
 * ✅ NOUVELLE FONCTION : Template pour scrapers Mawaqit standardisés
 */
const createMawaqitScraper = (sourceName, url) => {
  return createOptimizedScraper(async (page) => {
    console.log(`Navigation vers ${sourceName}...`);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    console.log("Attente du chargement des éléments...");
    await page.waitForSelector("div.prayers", { timeout: 15000 });
    await page.waitForFunction(
      () => document.querySelectorAll("div.prayers > div").length > 0,
      { timeout: 10000 }
    );

    await humanBehavior.moveMouseRandomly(page, "div.prayers");

    console.log("Extraction des données...");
    const rawTimes = await page.evaluate(() => {
      const prayerTimes = {};
      const prayerElements = document.querySelectorAll("div.prayers > div");

      prayerElements.forEach((prayerElement) => {
        const nameElement = prayerElement.querySelector("div.name");
        const timeElement = prayerElement.querySelector("div.time");
        const waitElement = prayerElement.querySelector("div.wait > div");

        if (nameElement && timeElement) {
          let prayerName = nameElement.textContent.trim().toLowerCase();
          const baseTime = timeElement.textContent.trim();
          const jamahTime = waitElement ? waitElement.textContent.trim() : null;

          prayerTimes[prayerName] = {
            baseTime: baseTime,
            jamahTime: jamahTime,
          };
        }
      });

      return prayerTimes;
    });

    console.log("Normalisation des données...");
    const normalizedTimes = {};
    for (let [prayer, data] of Object.entries(rawTimes)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      if (prayer) {
        const timeToNormalize = data.jamahTime || data.baseTime;
        const normalizedTime = normalizeTime(timeToNormalize);
        if (normalizedTime) {
          normalizedTimes[prayer] = normalizedTime;
        }
      }
    }

    const result = {
      source: sourceName,
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    return prayerUtils.normalizeResult(result);
  });
};

module.exports = {
  createOptimizedScraper,
  createScraperWithCustomInterception,
  createScraperNoInterception,
  createMawaqitScraper,
  scrapeAishaMosqueOptimized,
  simpleTestScraper,
  getTodayDate,
};
