// centraleMosqueBham.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const { DateTime } = require('luxon');

// Configuration StealthPlugin
puppeteer.use(StealthPlugin());

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
];

const randomDelay = async (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
};

const convertTo24Hour = (timeStr) => {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours, 10);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const waitForCloudflare = async (page) => {
  try {
    await page.waitForFunction(
      () => {
        return !document.querySelector('#challenge-running') &&
               !document.querySelector('#cf-spinner') &&
               !document.querySelector('.cf-browser-verification');
      },
      { timeout: 30000 }
    );
    await randomDelay(2000, 4000);
  } catch (error) {
    console.log('Erreur lors de l\'attente Cloudflare:', error.message);
    throw new Error('Impossible de passer la protection Cloudflare');
  }
};

const scrapeCentralMosque = async (verbose = false) => {
  let browser;
  try {
    if (verbose) console.log('Démarrage du scraping...');
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        `--user-agent=${randomUserAgent}`,
        '--window-size=1920,1080',
      ],
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    await page.setDefaultNavigationTimeout(120000);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(randomUserAgent);
    
    await page.setExtraHTTPHeaders({
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

    await page.evaluateOnNewDocument(() => {
      delete Object.getPrototypeOf(navigator).webdriver;
      Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
      Object.defineProperty(navigator, 'productSub', { get: () => '20100101' });
      Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
      window.navigator.chrome = { runtime: {} };
    });

    if (verbose) console.log('Navigation vers Central Mosque...');
    
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const response = await page.goto('http://centralmosque.org.uk/', {
          waitUntil: 'networkidle2',
          timeout: 60000
        });

        if (response.status() === 520 || response.status() === 403) {
          if (verbose) console.log(`Statut de réponse ${response.status()}, tentative de contournement Cloudflare...`);
          await waitForCloudflare(page);
        }

        const content = await page.content();
        if (content.includes('mptt-wrapper-container')) {
          if (verbose) console.log('Page chargée avec succès');
          break;
        } else {
          throw new Error('Contenu de la page non valide');
        }
      } catch (error) {
        retryCount++;
        if (verbose) console.log(`Tentative ${retryCount}/${maxRetries} échouée:`, error.message);
        if (retryCount === maxRetries) throw error;
        await randomDelay(10000, 15000);
      }
    }

    if (verbose) console.log('Attente des éléments de prière...');
    await page.waitForSelector('.mptt-wrapper-container', { 
      timeout: 30000,
      visible: true 
    });

    const ukTime = DateTime.now().setZone('Europe/London');
    const dateText = ukTime.toISODate();

    if (verbose) console.log('Extraction des données...');
    const data = await page.evaluate(() => {
      const prayers = {};
      const prayerElements = document.querySelectorAll('.prayer-time');

      prayerElements.forEach(element => {
        const titleElement = element.querySelector('.mptt-sec-title');
        const jamaatElement = element.querySelector('.prayer-jamaat');

        if (titleElement && jamaatElement) {
          const title = titleElement.textContent.trim().toLowerCase();
          const jamaatTime = jamaatElement.textContent.trim();

          prayers[title] = jamaatTime;
        }
      });

      return prayers;
    });

    const formattedTimes = {};
    for (const [prayer, time] of Object.entries(data)) {
      formattedTimes[prayer] = convertTo24Hour(time);
    }

    const result = {
      source: 'Central Mosque Birmingham',
      date: dateText,
      times: formattedTimes
    };

    if (verbose) console.log('Données extraites avec succès:', result);
    return result;

  } catch (error) {
    console.error('Erreur détaillée lors du scraping:', error);
    throw new Error(`Erreur de scraping: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      if (verbose) console.log('Navigateur fermé');
    }
  }
};


module.exports = {
  scrapeCentralMosque
};
