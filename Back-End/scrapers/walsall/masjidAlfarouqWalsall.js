// masjidAlfarouqWalsall.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  // ... autres User Agents
];

const randomDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

const scrapeMasjidAlFarouq = async () => {
  let browser;
  try {
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    const page = await browser.newPage();

    await page.setUserAgent(randomUserAgent);
    await page.setViewport({ width: 1280, height: 800 });
    await page.setJavaScriptEnabled(true);

    // Masquer le webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    console.log('Navigation vers la page principale...');
    await page.goto('https://www.masjidalfarouq.org.uk/', { waitUntil: 'networkidle2' });
    console.log('Page principale chargée avec succès');

    // Simuler des mouvements de souris et des délais aléatoires
    await page.mouse.move(100, 100);
    await randomDelay(100, 300);
    // ... autres mouvements

    await page.waitForSelector('div.my-5', { timeout: 30000 });

    const data = await page.evaluate(() => {
      const times = {};
      const dateText = new Date().toISOString().split('T')[0]; // Utiliser la date système

      const prayerElements = document.querySelectorAll(
        'div.my-5 div.flex.flex-row.justify-around.items-center.flex-wrap.mt-2 div.flex.flex-col.items-center.max-w-xs.flex'
      );

      prayerElements.forEach((prayerElement) => {
        const nameElement = prayerElement.querySelector('h3.font-elMessiri.font-medium');
        const timeElements = prayerElement.querySelectorAll('h4.p-0\\.5.sm\\:p-1.font-medium');
        const timeElement = timeElements.length >= 2 ? timeElements[1] : null;

        if (nameElement && timeElement) {
          let prayerName = nameElement.textContent.trim().toLowerCase();
          const prayerTime = timeElement.textContent.trim();

          // Normalisation des noms de prières
          if (prayerName === 'dhuhr' || prayerName === 'zuhr') prayerName = 'dhuhr';
          if (prayerName === 'jummah' || prayerName === "jumu'ah") prayerName = 'jumuah1';

          const allowedPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah1'];

          if (allowedPrayers.includes(prayerName)) {
            times[prayerName] = prayerTime;
          }
        }
      });

      return { dateText, times };
    });

    if (!data || Object.keys(data.times).length === 0) {
      throw new Error("Les données n'ont pas pu être extraites.");
    }

    console.log('Date extraite :', data.dateText);
    console.log('Horaires extraits :', data.times);

    return data;
  } catch (error) {
    console.error('Erreur lors du scraping :', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = scrapeMasjidAlFarouq;
