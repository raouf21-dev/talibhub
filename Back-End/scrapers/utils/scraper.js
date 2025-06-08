// scraperUtils.js - Utilitaires techniques purs pour le scraping
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { executablePath } = require("puppeteer");
const { DateTime } = require("luxon");
const fs = require("fs");

// Configuration de base du stealth plugin
const stealth = StealthPlugin();
stealth.enabledEvasions.delete("webgl.vendor");
stealth.enabledEvasions.delete("webgl.renderer");
puppeteer.use(stealth);

// Configuration du navigateur (technique pure, sans anti-détection)
const getDefaultBrowserConfig = () => ({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--disable-gpu",
    "--window-size=1920,1080",
  ],
  ignoreHTTPSErrors: true,
});

const setupChromiumPath = async () => {
  try {
    if (fs.existsSync("/usr/bin/chromium-browser")) {
      return "/usr/bin/chromium-browser";
    }
    return executablePath();
  } catch (error) {
    return executablePath();
  }
};

// Headers HTTP techniques de base (sans éléments humains)
const getDefaultHeaders = () => ({
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
});

class TimeValidator {
  static validateTime(timeStr) {
    if (!timeStr) return null;

    // Nettoyer la chaîne
    timeStr = timeStr.trim().toLowerCase();
    if (timeStr === "--:--" || timeStr === "n/a" || timeStr === "--")
      return null;

    try {
      // Parser le format AM/PM si présent
      let hours, minutes;
      const isPM = timeStr.includes("pm");
      const isAM = timeStr.includes("am");

      // Enlever AM/PM et nettoyer
      timeStr = timeStr.replace(/[ap]m/i, "").trim();

      // Gérer différents formats de séparation
      if (timeStr.includes(":")) {
        [hours, minutes] = timeStr.split(":").map(Number);
      } else {
        // Format sans séparateur (e.g., "0730")
        timeStr = timeStr.padStart(4, "0");
        hours = parseInt(timeStr.slice(0, 2));
        minutes = parseInt(timeStr.slice(2));
      }

      // Validation de base
      if (isNaN(hours) || isNaN(minutes)) return null;
      if (minutes >= 60) return null;

      // Conversion AM/PM
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;

      // Validation finale
      if (hours >= 24) return null;

      // Formatage
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}`;
    } catch (error) {
      console.error("Erreur de validation du temps:", error);
      return null;
    }
  }

  static validatePrayerTimes(times) {
    const prayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const validated = {};
    let hasValidTimes = false;

    for (const prayer of prayers) {
      validated[prayer] = this.validateTime(times[prayer]);
      if (validated[prayer]) hasValidTimes = true;
    }

    return hasValidTimes ? validated : null;
  }
}

const browserUtils = {
  async launch(options = {}) {
    const defaultConfig = getDefaultBrowserConfig();

    try {
      const execPath = await setupChromiumPath();
      const browser = await puppeteer.launch({
        ...defaultConfig,
        ...options,
        executablePath: execPath,
      });

      return browser;
    } catch (error) {
      console.error("Erreur lors du lancement du navigateur:", error);
      throw error;
    }
  },

  async createPage(browser) {
    const page = await browser.newPage();
    await this.setupPage(page);
    return page;
  },

  // Configuration technique pure d'une page (sans anti-détection)
  async setupPage(page) {
    // Configuration de base
    await page.setDefaultNavigationTimeout(30000);
    await page.setRequestInterception(true);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders(getDefaultHeaders());

    // Bloquer les ressources inutiles pour optimiser les performances
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Gérer les erreurs de page
    page.on("error", (error) => {
      console.error("Erreur de page:", error);
    });
  },
};

// Navigation sécurisée
const safeNavigation = async (page, url, options = {}) => {
  const config = {
    retries: 2,
    timeout: 25000,
    waitUntil: "networkidle0",
    ...options,
  };

  for (let i = 0; i < config.retries; i++) {
    try {
      const response = await page.goto(url, {
        waitUntil: config.waitUntil,
        timeout: config.timeout,
      });

      // Vérifier et gérer les erreurs de Cloudflare
      if (response.status() === 403 || response.status() === 503) {
        const content = await page.content();
        if (
          content.includes("challenge-running") ||
          content.includes("cf-browser-verification")
        ) {
          await page.waitForTimeout(5000);
          continue;
        }
      }

      return response;
    } catch (error) {
      if (i === config.retries - 1) throw error;
      await page.waitForTimeout(3000);
    }
  }
};

// Utilitaires de temps
const normalizeTime = (timeStr, prayerName = null) => {
  if (!timeStr) return null;

  try {
    timeStr = timeStr.trim().toLowerCase();
    if (timeStr === "--:--" || timeStr === "n/a" || timeStr === "--")
      return null;

    let hours, minutes;
    const isPM = timeStr.includes("pm");
    const isAM = timeStr.includes("am");

    timeStr = timeStr.replace(/[ap]m/i, "").trim();

    if (timeStr.includes(":") || timeStr.includes(".")) {
      [hours, minutes] = timeStr.split(/[:.]/g).map(Number);
    } else {
      timeStr = timeStr.padStart(4, "0");
      hours = parseInt(timeStr.slice(0, 2));
      minutes = parseInt(timeStr.slice(2));
    }

    if (isNaN(hours) || isNaN(minutes) || minutes >= 60) return null;

    // Règles de conversion spécifiques aux prières
    if (!isPM && !isAM) {
      if (hours >= 24) return null;

      // Ne pas modifier les heures si elles sont déjà dans le bon format 24h
      switch (prayerName) {
        case "fajr":
          // Fajr est toujours AM
          if (hours === 12) hours = 0;
          break;
        case "dhuhr":
          // Pour dhuhr, accepter à la fois le format 12h et 24h
          // Ne pas modifier si déjà en format 24h (13:00)
          if (hours < 12 && hours !== 0) hours += 12;
          break;
        case "asr":
        case "maghrib":
        case "isha":
          // Pour les prières de l'après-midi/soir
          // Ne pas modifier si déjà en format 24h
          if (hours < 12 && hours !== 0) hours += 12;
          break;
      }
    } else {
      // Conversion standard AM/PM
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  } catch (error) {
    console.error("Erreur de normalisation du temps:", error);
    return null;
  }
};

// Utilitaires de prière
const prayerUtils = {
  standardizePrayerName: (name) => {
    if (!name) return null;

    const prayerMappings = {
      fajr: "fajr",
      zuhr: "dhuhr",
      dhuhr: "dhuhr",
      duhr: "dhuhr",
      zohar: "dhuhr",
      zuhar: "dhuhr",
      dhur: "dhuhr",
      asr: "asr",
      maghrib: "maghrib",
      isha: "isha",
      esha: "isha",
    };

    return prayerMappings[name.toLowerCase().trim()] || null;
  },

  normalizeResult: (result) => {
    if (!result || !result.times) {
      throw new Error("Format de résultat invalide");
    }

    const requiredPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const optionalPrayers = ["jumuah1", "jumuah2", "jumuah3"];
    const normalizedTimes = {};

    // Normalisation des prières obligatoires
    for (const prayer of requiredPrayers) {
      if (result.times[prayer]) {
        // Passer le nom de la prière en second paramètre
        const normalizedTime = normalizeTime(result.times[prayer], prayer);
        if (normalizedTime) {
          normalizedTimes[prayer] = normalizedTime;
        }
      }
    }

    // Ajout des prières optionnelles si elles existent
    for (const prayer of optionalPrayers) {
      if (result.times[prayer]) {
        // Passer le nom de la prière en second paramètre
        const normalizedTime = normalizeTime(result.times[prayer], prayer);
        if (normalizedTime) {
          normalizedTimes[prayer] = normalizedTime;
        }
      }
    }

    // Vérifier qu'au moins une prière est valide
    const hasValidTimes = Object.values(normalizedTimes).some(
      (time) => time !== null
    );
    if (!hasValidTimes) {
      throw new Error("Aucune heure de prière valide trouvée");
    }

    return {
      source: result.source,
      date: result.date,
      times: normalizedTimes,
    };
  },
};

// Utilitaires pour les erreurs
const errorUtils = {
  saveFailedPage: async (page, filename) => {
    try {
      const content = await page.content();
      fs.writeFileSync(filename, content);
      console.log(`Page sauvegardée dans ${filename}`);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la page:", error);
    }
  },

  logScrapingError: (source, error) => {
    console.error(`Erreur lors du scraping de ${source}:`, {
      source,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  },
};

// Utilitaires de date
const dateUtils = {
  getUKDateTime: () => DateTime.now().setZone("Europe/London"),
  getUKDate: () => DateTime.now().setZone("Europe/London").toISODate(),
};

// Exporter tous les utilitaires techniques
module.exports = {
  TimeValidator,
  browserUtils,
  getDefaultBrowserConfig,
  getDefaultHeaders,
  setupChromiumPath,
  safeNavigation,
  normalizeTime,
  prayerUtils,
  errorUtils,
  dateUtils,
};
