const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const { DateTime } = require('luxon');

// Configuration StealthPlugin avec des options optimisées
const stealth = StealthPlugin();

// Vous pouvez désactiver certaines fonctionnalités du plugin si nécessaire
// Par exemple, désactiver le plugin pour WebGL si ce n'est pas nécessaire
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');

puppeteer.use(stealth);

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Mobile Safari/537.36',
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
    // Attendre que la page Cloudflare soit passée
    await page.waitForFunction(
      () => {
        return !document.querySelector('#challenge-running') &&
               !document.querySelector('#cf-spinner') &&
               !document.querySelector('.cf-browser-verification');
      },
      { timeout: 15000 }  // Réduit de 20000 à 15000 ms
    );

    // Attente supplémentaire pour s'assurer que la page est bien chargée
    await randomDelay(1000, 1500);  // Réduit de 1000-2000 à 1000-1500 ms
  } catch (error) {
    console.log('Erreur lors de l\'attente Cloudflare:', error.message);
    throw new Error('Impossible de passer la protection Cloudflare');
  }
};

const scrapeCentralMosque = async () => {
  let browser;
  try {
    console.log('Démarrage du scraping...');
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
    
    // Configuration de la page
    await page.setDefaultNavigationTimeout(45000);  // Réduit de 60000 à 45000 ms
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

    console.log('Navigation vers Central Mosque...');

    let retryCount = 0;
    const maxRetries = 2;  // Réduit de 3 à 2 tentatives

    while (retryCount < maxRetries) {
      try {
        const response = await page.goto('http://centralmosque.org.uk/', {
          waitUntil: 'domcontentloaded',  // Change de 'networkidle2' à 'domcontentloaded'
          timeout: 25000  // Réduit de 30000 à 25000 ms
        });

        if (response.status() === 520 || response.status() === 403) {
          console.log(`Statut de réponse ${response.status()}, tentative de contournement Cloudflare...`);
          await waitForCloudflare(page);
        }

        const content = await page.content();
        if (content.includes('mptt-wrapper-container')) {
          console.log('Page chargée avec succès');
          break;
        } else {
          throw new Error('Contenu de la page non valide');
        }
      } catch (error) {
        retryCount++;
        console.log(`Tentative ${retryCount}/${maxRetries} échouée:`, error.message);
        if (retryCount === maxRetries) throw error;
        await randomDelay(3000, 5000);  // Réduit de 5000-8000 à 3000-5000 ms
      }
    }

    console.log('Attente des éléments de prière...');
    await page.waitForSelector('.mptt-wrapper-container', { 
      timeout: 15000,  // Réduit de 20000 à 15000 ms
      visible: true 
    });

    const ukTime = DateTime.now().setZone('Europe/London');
    const dateText = ukTime.toISODate();

    console.log('Extraction des données...');
    const data = await page.evaluate(() => {
      const prayers = {};
      const prayerElements = document.querySelectorAll('.prayer-time');

      prayerElements.forEach(element => {
        const titleElement = element.querySelector('.mptt-sec-title');
        const jamaatElement = element.querySelector('.prayer-jamaat');

        if (titleElement && jamaatElement) {
          let title = titleElement.textContent.trim().toLowerCase();
          const jamaatTime = jamaatElement.textContent.trim();

          // Renommer 'zuhr' en 'dhuhr'
          if (title === 'zuhr') {
            title = 'dhuhr';
          }

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

    console.log('Données extraites avec succès:', result);
    return result;

  } catch (error) {
    console.error('Erreur détaillée lors du scraping:', error);
    throw new Error(`Erreur de scraping: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navigateur fermé');
    }
  }
};

module.exports = scrapeCentralMosque;
