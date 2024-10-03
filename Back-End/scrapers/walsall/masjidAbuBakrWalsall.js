// masjidAbuBakrWalsall.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Utilisation du plugin Stealth
puppeteer.use(StealthPlugin());

// Liste des User Agents pour rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  // ... autres User Agents
];

const randomDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

const scrapeMasjidAbuBakrWalsall = async () => {
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
    await page.goto('https://mosquefinder.co.uk/masjid-abu-bakr-walsall/salaah-timings', { waitUntil: 'networkidle2' });
    console.log('Page principale chargée avec succès');

    // Simuler des mouvements de souris et des délais aléatoires
    await page.mouse.move(100, 100);
    await randomDelay(100, 300);
    // ... autres mouvements

    await page.waitForSelector('table.tw.widget-timming', { timeout: 30000 });

    const data = await page.evaluate(() => {
      const times = {};
      const dateText = new Date().toISOString().split('T')[0]; // Utiliser la date système

      const prayerRows = document.querySelectorAll('table.tw.widget-timming tbody tr');

      prayerRows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          let prayerName = cells[0].textContent.trim().toLowerCase();
          const prayerTime = cells[2].textContent.trim();

          // Normalisation des noms de prières
          if (prayerName === 'duhr' || prayerName === 'dhuhr' || prayerName === 'zuhr') {
            prayerName = 'dhuhr';
          } else if (prayerName === 'jummah' || prayerName === "jumu'ah") {
            prayerName = 'jumuah1';
          }

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

module.exports = scrapeMasjidAbuBakrWalsall;
