const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const { DateTime } = require('luxon');
const fs = require('fs');

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
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.111 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:116.0) Gecko/20100101 Firefox/116.0',
];

const randomDelay = (min, max) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );

const scrapeQubaIsmalicCenter = async () => {
  let browser;
  try {
    console.log('Démarrage du scraping...');
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=800,600',
      ],
      ignoreHTTPSErrors: true,
    };

    try {
      if (fs.existsSync('/usr/bin/chromium-browser')) {
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
    await page.setUserAgent(randomUserAgent);
    await page.setViewport({ width: 800, height: 600 });

    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    let retryCount = 0;
    const maxRetries = 2;
    let frame;

    while (retryCount < maxRetries) {
      try {
        console.log('Navigation vers Quba Islamic Center...');
        await page.goto('https://mawaqit.net/en/quba-islamic-cultural-centre-birmingham-b7-4ny-united-kingdom/', {
          waitUntil: 'domcontentloaded',
          timeout: 25000,
        });
        console.log('Page principale chargée avec succès');

        await page.mouse.move(100, 100);
        await randomDelay(50, 150);

        await page.waitForSelector('div.prayers', { timeout: 15000 });
        frame = page;

        await frame.waitForSelector('div.prayers', { timeout: 10000 });

        const hasContent = await frame.evaluate(() => {
          return document.querySelectorAll('div.prayers > div').length > 0;
        });

        if (hasContent) {
          console.log('Contenu valide détecté');
          break;
        } else {
          throw new Error("Contenu de la page non valide");
        }
      } catch (error) {
        retryCount++;
        console.log(`Tentative ${retryCount}/${maxRetries} échouée:`, error.message);
        if (retryCount === maxRetries) {
          const content = await page.content();
          fs.writeFileSync('failed_page_qubaIslamicCenter.html', content);
          console.log('Le contenu de la page a été sauvegardé dans failed_page_qubaIslamicCenter.html pour analyse.');
          throw error;
        }
        await randomDelay(3000, 5000);
      }
    }

    if (!frame) {
      throw new Error("Frame non défini après les tentatives");
    }

    console.log('Extraction des données...');
    const ukTime = DateTime.now().setZone('Europe/London');
    const dateText = ukTime.toISODate();

    const times = await frame.evaluate(() => {
      const prayerTimes = {};
      const prayerElements = document.querySelectorAll('div.prayers > div');

      prayerElements.forEach((prayerElement) => {
        const nameElement = prayerElement.querySelector('div.name');
        const timeElement = prayerElement.querySelector('div.time');
        const waitElement = prayerElement.querySelector('div.wait > div');

        if (nameElement && timeElement) {
          let prayerName = nameElement.textContent.trim().toLowerCase();
          let prayerTime = timeElement.textContent.trim();
          let waitText = waitElement ? waitElement.textContent.trim() : '+0';

          switch (prayerName) {
            case 'fajr': prayerName = 'fajr'; break;
            case 'zuhr':
            case 'dhuhr': prayerName = 'dhuhr'; break;
            case 'asr': prayerName = 'asr'; break;
            case 'maghrib': prayerName = 'maghrib'; break;
            case 'isha': prayerName = 'isha'; break;
            default: prayerName = null;
          }

          if (prayerName) {
            if (/^\+\d+$/.test(waitText)) {
              const offsetMinutes = parseInt(waitText.replace('+', ''), 10);
              const [hours, minutes] = prayerTime.split(':').map(Number);
              const date = new Date();
              date.setHours(hours, minutes, 0, 0);
              date.setMinutes(date.getMinutes() + offsetMinutes);
              prayerTimes[prayerName] = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            } else if (/^\d{1,2}:\d{2}$/.test(waitText)) {
              prayerTimes[prayerName] = waitText;
            }
          }
        }
      });
      
      return prayerTimes;
    });

    const result = {
      source: 'Quba Islamic Center Birmingham',
      date: dateText,
      times: times
    };

    console.log('Données extraites avec succès:', result);
    return result;

  } catch (error) {
    console.error('Erreur lors du scraping:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navigateur fermé');
    }
  }
};

module.exports = scrapeQubaIsmalicCenter;