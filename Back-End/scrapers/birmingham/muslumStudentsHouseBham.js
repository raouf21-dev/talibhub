const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const { DateTime } = require('luxon');

// Configuration StealthPlugin
const stealth = StealthPlugin();
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

const detectCloudflare = async (page) => {
  const content = await page.content();
  return content.includes('challenge-running') || 
         content.includes('cf-browser-verification') ||
         content.includes('_cf-browser-verification');
};

const waitForCloudflare = async (page) => {
  try {
    await page.waitForFunction(
      () => {
        return !document.querySelector('#challenge-running') &&
               !document.querySelector('#cf-spinner') &&
               !document.querySelector('.cf-browser-verification');
      },
      { timeout: 15000 }
    );
    await randomDelay(1000, 1500);
  } catch (error) {
    throw new Error('Cloudflare protection détectée et non contournée');
  }
};

const scrapeMSHUK = async () => {
  let browser;
  try {
    console.log('Démarrage du scraping MSHUK...');
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const launchOptions = {
      headless: true,
      executablePath: '/snap/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
      ],
      ignoreHTTPSErrors: true,
    };

    try {
      if (require('fs').existsSync('/usr/bin/chromium-browser')) {
        console.log('Utilisation de Chromium système');
        launchOptions.executablePath = '/usr/bin/chromium-browser';
      } else {
        console.log('Utilisation de Chromium Puppeteer');
        launchOptions.executablePath = executablePath();
      }
    } catch (error) {
      console.log('Fallback sur Chromium Puppeteer');
      launchOptions.executablePath = executablePath();
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(45000);
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

    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount < maxRetries) {
      try {
        console.log('Navigation vers MSHUK...');
        const response = await page.goto('https://www.mshuk.org/', {
          waitUntil: 'domcontentloaded',
          timeout: 25000
        });

        if (await detectCloudflare(page)) {
          console.log('Protection Cloudflare détectée, tentative de contournement...');
          await waitForCloudflare(page);
        }

        await page.waitForSelector('.section-prayer-horizontal-times', {
          timeout: 15000,
          visible: true
        });

        console.log('Extraction des données...');
        const data = await page.evaluate(() => {
          const prayers = {};
          const prayerItems = document.querySelectorAll('.section-prayer-horizontal-times-item');
          
          prayerItems.forEach(item => {
            const nameElement = item.querySelector('span');
            const jamaatElement = item.querySelector('div:last-child');
            
            if (nameElement && jamaatElement) {
              const name = nameElement.textContent.trim().toLowerCase();
              const time = jamaatElement.textContent.trim();
              if (name && time) {
                prayers[name] = time;
              }
            }
          });
          
          return prayers;
        });

        const ukTime = DateTime.now().setZone('Europe/London');
        const dateText = ukTime.toISODate();

        const result = {
          source: 'MSHUK',
          date: dateText,
          times: data
        };

        console.log('Données extraites avec succès:', result);
        return result;

      } catch (error) {
        retryCount++;
        console.log(`Tentative ${retryCount}/${maxRetries} échouée:`, error.message);
        if (retryCount === maxRetries) throw error;
        await randomDelay(3000, 5000);
      }
    }

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

module.exports = scrapeMSHUK;