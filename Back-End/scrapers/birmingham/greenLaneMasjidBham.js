// greenLaneMasjidBham.js

// centralMosqueScraper.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { DateTime } = require('luxon');

puppeteer.use(StealthPlugin());

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:116.0) Gecko/20100101 Firefox/116.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
];

const randomDelay = (min, max) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );

const scrapeCentralMosquePrayerTimes = async () => {
  let browser;
  try {
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
    });
    const page = await browser.newPage();

    await page.setUserAgent(randomUserAgent);
    await page.setViewport({ width: 1280, height: 800 });
    await page.setJavaScriptEnabled(true);

    // Masquer le webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    console.log('Navigation vers Central Mosque...');
    await page.goto('http://centralmosque.org.uk/', { waitUntil: 'networkidle2' });
    console.log('Page chargée avec succès');

    await page.mouse.move(100, 100);
    await randomDelay(100, 300);

    // Attendre que les éléments contenant les horaires soient chargés
    await page.waitForSelector('.prayer-time', { timeout: 30000 });

    // Calculer la date actuelle
    const currentDate = DateTime.now().toISODate();

    const data = await page.evaluate(() => {
      const times = {};
      const prayerElements = document.querySelectorAll('.prayer-time');

      prayerElements.forEach((prayerEl) => {
        const prayerNameEl = prayerEl.querySelector('.mpt-sec-title');
        const jamaatTimeEl = prayerEl.querySelector('.prayer-jamaat');

        if (prayerNameEl && jamaatTimeEl) {
          let prayerName = prayerNameEl.textContent.trim().toLowerCase();
          const jamaatTime = jamaatTimeEl.textContent.trim();

          // Gestion des noms de prières spécifiques
          if (prayerName.includes('fajr')) {
            prayerName = 'fajr';
          } else if (prayerName.includes('zuhr') || prayerName.includes('dhuhr')) {
            prayerName = 'dhuhr';
          } else if (prayerName.includes('asr')) {
            prayerName = 'asr';
          } else if (prayerName.includes('maghrib')) {
            prayerName = 'maghrib';
          } else if (prayerName.includes('isha')) {
            prayerName = 'isha';
          }

          switch (prayerName) {
            case 'fajr':
              times.fajr = jamaatTime;
              break;
            case 'dhuhr':
              times.dhuhr = jamaatTime;
              break;
            case 'asr':
              times.asr = jamaatTime;
              break;
            case 'maghrib':
              times.maghrib = jamaatTime;
              break;
            case 'isha':
              times.isha = jamaatTime;
              break;
            default:
              break;
          }
        }
      });

      return { times };
    });

    if (!data || Object.keys(data.times).length === 0) {
      throw new Error("Les données n'ont pas pu être extraites.");
    }

    console.log('Horaires extraits :', data.times);

    return data;
  } catch (error) {
    console.error('Erreur lors du scraping :', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};


module.exports = scrapeCentralMosquePrayerTimes;
