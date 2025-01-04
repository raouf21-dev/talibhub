// scraperUtils.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const { DateTime } = require('luxon');
const fs = require('fs');

// Configuration de base du stealth plugin
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');
puppeteer.use(stealth);

// User Agents
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0'
];

// Configuration du navigateur
const getDefaultBrowserConfig = () => ({
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
    ],
    ignoreHTTPSErrors: true
});

const setupChromiumPath = async () => {
    try {
        if (fs.existsSync('/usr/bin/chromium-browser')) {
            return '/usr/bin/chromium-browser';
        }
        return executablePath();
    } catch (error) {
        return executablePath();
    }
};

const getDefaultHeaders = () => ({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'DNT': '1'
});

class TimeValidator {
  static validateTime(timeStr) {
      if (!timeStr) return null;
      
      // Nettoyer la chaîne
      timeStr = timeStr.trim().toLowerCase();
      if (timeStr === '--:--' || timeStr === 'n/a' || timeStr === '--') return null;

      try {
          // Parser le format AM/PM si présent
          let hours, minutes;
          const isPM = timeStr.includes('pm');
          const isAM = timeStr.includes('am');
          
          // Enlever AM/PM et nettoyer
          timeStr = timeStr.replace(/[ap]m/i, '').trim();
          
          // Gérer différents formats de séparation
          if (timeStr.includes(':')) {
              [hours, minutes] = timeStr.split(':').map(Number);
          } else {
              // Format sans séparateur (e.g., "0730")
              timeStr = timeStr.padStart(4, '0');
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
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      } catch (error) {
          console.error('Erreur de validation du temps:', error);
          return null;
      }
  }

  static validatePrayerTimes(times) {
      const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      const validated = {};
      let hasValidTimes = false;

      for (const prayer of prayers) {
          validated[prayer] = this.validateTime(times[prayer]);
          if (validated[prayer]) hasValidTimes = true;
      }

      // Vérifier les heures incohérentes
      if (validated.fajr && validated.dhuhr && 
          DateTime.fromFormat(validated.fajr, 'HH:mm') > DateTime.fromFormat(validated.dhuhr, 'HH:mm')) {
          validated.fajr = null;
      }

      return hasValidTimes ? validated : null;
  }
}

const browserUtils = {
  async launch(options = {}) {
      const defaultConfig = {
          headless: true,
          args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--disable-gpu',
              '--window-size=1920,1080',
          ],
          ignoreHTTPSErrors: true,
          defaultViewport: null
      };

      try {
          const execPath = await setupChromiumPath();
          const browser = await puppeteer.launch({
              ...defaultConfig,
              ...options,
              executablePath: execPath
          });

          return browser;
      } catch (error) {
          console.error('Erreur lors du lancement du navigateur:', error);
          throw error;
      }
  },

  async createPage(browser) {
      const page = await browser.newPage();
      await this.setupPage(page);
      return page;
  },

  async setupPage(page) {
      // Configuration de base
      await page.setDefaultNavigationTimeout(30000);
      await page.setRequestInterception(true);

      // Bloquer les ressources inutiles
      page.on('request', (request) => {
          const resourceType = request.resourceType();
          if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
              request.abort();
          } else {
              request.continue();
          }
      });

      // Gérer les erreurs de page
      page.on('error', error => {
          console.error('Erreur de page:', error);
      });

      // Anti-détection
      await page.evaluateOnNewDocument(() => {
          delete Object.getPrototypeOf(navigator).webdriver;
          window.navigator.chrome = { runtime: {} };
      });
  }
};

// Gestion des verrous pour les scrapers
class ScraperLockManager {
    constructor() {
        this._locks = new Map();
        this._timeouts = new Map();
        this._retryDelays = new Map();
    }

    async acquireLock(scraperId, timeout = 300000) { // 5 minutes timeout par défaut
        if (this._locks.get(scraperId)) {
            const retryCount = (this._retryDelays.get(scraperId) || 0) + 1;
            this._retryDelays.set(scraperId, retryCount);
            
            // Délai exponentiel avec un maximum de 30 secondes
            const delay = Math.min(Math.pow(2, retryCount) * 1000, 30000);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return false;
        }

        this._locks.set(scraperId, true);
        this._retryDelays.delete(scraperId);
        
        // Configure un timeout pour libérer automatiquement le verrou
        const timeoutId = setTimeout(() => {
            console.warn(`Lock timeout for scraper ${scraperId}`);
            this.releaseLock(scraperId);
        }, timeout);
        
        this._timeouts.set(scraperId, timeoutId);
        
        return true;
    }

    releaseLock(scraperId) {
        this._locks.delete(scraperId);
        
        const timeoutId = this._timeouts.get(scraperId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this._timeouts.delete(scraperId);
        }
    }

    isLocked(scraperId) {
        return this._locks.has(scraperId);
    }

    getActiveLocks() {
        return Array.from(this._locks.keys());
    }
}

// Configuration de la page
const setupBasicBrowserPage = async (browser) => {
    const page = await browser.newPage();
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    await page.setDefaultNavigationTimeout(45000);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(randomUserAgent);
    await page.setExtraHTTPHeaders(getDefaultHeaders());
    
    await page.evaluateOnNewDocument(() => {
        delete Object.getPrototypeOf(navigator).webdriver;
        Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
        Object.defineProperty(navigator, 'productSub', { get: () => '20100101' });
        Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
        window.navigator.chrome = { runtime: {} };
    });
    
    return page;
};

// Gestion des ressources
const setupResourceInterception = async (page) => {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['image', 'stylesheet', 'font'].includes(resourceType)) {
            request.abort();
        } else {
            request.continue();
        }
    });
};

// Utilitaires de temps et délais
const randomDelay = async (min, max) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
};

const normalizeTime = (timeStr, offsetMinutes = 0) => {
    if (!timeStr || timeStr === 'NaN:undefined' || timeStr === '--') return null;

    try {
        const originalStr = timeStr.toLowerCase();
        const isPM = originalStr.includes('pm');
        const isAM = originalStr.includes('am');
        timeStr = timeStr.replace(/[^0-9:]/g, '');

        if (!timeStr.includes(':')) {
            timeStr = timeStr.padStart(4, '0');
            timeStr = `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
        }

        let [hours, minutes] = timeStr.split(':').map(Number);
        
        // Applique le décalage
        if (offsetMinutes !== 0) {
            const date = new Date();
            date.setHours(hours, minutes + offsetMinutes, 0, 0);
            hours = date.getHours();
            minutes = date.getMinutes();
        }

        if (!prayerUtils.validatePrayerTime(hours, minutes)) return null;

        if (hours <= 12) {
            if (isPM && hours < 12) hours += 12;
            else if (isAM && hours === 12) hours = 0;
            else if (!isAM && !isPM) {
                hours = prayerUtils.convertToMilitaryTime(hours, minutes);
            }
        }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
        console.error('Erreur de normalisation du temps:', error);
        return null;
    }
};

// Utilitaires de prière
const prayerUtils = {
    standardizePrayerName: (name) => {
        if (!name) return null;
        
        // Liste explicite des prières autorisées et leurs variations
        const prayerMappings = {
            'fajr': 'fajr',
            'zuhr': 'dhuhr',
            'dhuhr': 'dhuhr',
            'duhr': 'dhuhr',
            'zohar': 'dhuhr',
            'dhur': 'dhuhr',
            'asr': 'asr',
            'maghrib': 'maghrib',
            'isha': 'isha'
        };

        // Exclure explicitement certaines prières
        const excludedPrayers = ['sunrise', 'sunset', 'shuruq', 'zawaal', 'jumuah'];
        const normalizedName = name.toLowerCase().trim();
        
        if (excludedPrayers.includes(normalizedName)) {
            return null;
        }

        return prayerMappings[normalizedName] || null;
    },

    validatePrayerTime: (hours, minutes) => {
        return !isNaN(hours) && !isNaN(minutes) &&
               hours >= 0 && hours <= 23 &&
               minutes >= 0 && minutes <= 59;
    },

    convertToMilitaryTime: (hours, minutes) => {
        switch (hours) {
            case 2:
            case 3: return hours + 12; // asr
            case 4:
            case 5: return hours + 12; // maghrib
            case 6:
            case 7: return minutes === 30 ? hours + 12 : hours; // isha
            default: return hours;
        }
    },

    normalizeResult: (result) => {
        const requiredPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const normalized = {
            source: result.source,
            date: result.date,
            times: {}
        };
    
        for (const prayer of requiredPrayers) {
            const time = result.times[prayer];
            // Vérifie que le temps est valide avant de l'inclure
            if (time && typeof time === 'string' && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
                normalized.times[prayer] = time;
            } else {
                normalized.times[prayer] = null;
            }
        }
    
        // Vérification supplémentaire pour s'assurer qu'au moins une prière est valide
        const hasValidTimes = Object.values(normalized.times).some(time => time !== null);
        if (!hasValidTimes) {
            throw new Error('Aucune heure de prière valide trouvée');
        }
    
        return normalized;
    }
};

// Gestion de Cloudflare
const cloudflareUtils = {
    detect: async (page) => {
        const content = await page.content();
        return content.includes('challenge-running') ||
               content.includes('cf-browser-verification');
    },

    wait: async (page) => {
        await page.waitForFunction(
            () => !document.querySelector('#challenge-running') &&
                  !document.querySelector('#cf-spinner') &&
                  !document.querySelector('.cf-browser-verification'),
            { timeout: 15000 }
        );
        await randomDelay(1000, 1500);
    }
};

// Navigation sécurisée
const safeNavigation = async (page, url, options = {}) => {
    const config = {
        retries: 2,
        timeout: 25000,
        waitUntil: 'domcontentloaded',
        ...options
    };

    for (let i = 0; i < config.retries; i++) {
        try {
            const response = await page.goto(url, {
                waitUntil: config.waitUntil,
                timeout: config.timeout
            });

            if (response.status() === 520 || response.status() === 403) {
                await cloudflareUtils.wait(page);
            }

            return response;
        } catch (error) {
            if (i === config.retries - 1) throw error;
            await randomDelay(3000, 5000);
        }
    }
};

// Gestion des erreurs
const errorUtils = {
    saveFailedPage: async (page, filename) => {
        try {
            const content = await page.content();
            fs.writeFileSync(filename, content);
            console.log(`Page sauvegardée dans ${filename}`);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la page:', error);
        }
    },

    logScrapingError: (source, error) => {
        console.error(`Erreur lors du scraping de ${source}:`, {
            source,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
};

// Date utils
const dateUtils = {
    getUKDateTime: () => DateTime.now().setZone('Europe/London'),
    getUKDate: () => DateTime.now().setZone('Europe/London').toISODate()
};

// Instance du gestionnaire de verrous
const scraperLock = new ScraperLockManager();

// Création d'un scraper avec gestion des verrous
const createScraper = (scraperId, scraperFunction) => {
    return async () => {
        try {
            if (!(await scraperLock.acquireLock(scraperId))) {
                console.log(`Scraper ${scraperId} is already running`);
                return null;
            }

            const result = await scraperFunction();
            return result;

        } catch (error) {
            errorUtils.logScrapingError(`Scraper ${scraperId}`, error);
            throw error;

        } finally {
            scraperLock.releaseLock(scraperId);
        }
    };
};

// Exports
module.exports = {
  TimeValidator,
    browserUtils,
    getDefaultBrowserConfig,
    getDefaultHeaders,
    setupBasicBrowserPage,
    setupChromiumPath,
    setupResourceInterception,
    randomDelay,
    normalizeTime,
    prayerUtils,
    cloudflareUtils,
    safeNavigation,
    errorUtils,
    dateUtils,
    scraperLock,
    createScraper
};