// Back-End/scrapers/scraperUtils.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const { DateTime } = require('luxon');
const fs = require('fs');

// Configuration globale pour StealthPlugin
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
    const mapping = {
      'zuhr': 'dhuhr',
      'duhr': 'dhuhr',
      'zohar': 'dhuhr',
      'dhur': 'dhuhr'
    };
    return mapping[name.toLowerCase()] || name.toLowerCase();
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

    requiredPrayers.forEach(prayer => {
      normalized.times[prayer] = result.times[prayer] || null;
    });

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

module.exports = {
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
  dateUtils
};