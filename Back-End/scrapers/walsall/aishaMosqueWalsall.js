// aishaMosqueWalsall.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Utilisation du plugin Stealth pour éviter la détection
puppeteer.use(StealthPlugin());

const scrapeAishaMosque = async () => {
  let browser;
  try {
    // Lancer le navigateur en mode headless
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Définir un User Agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
    );

    console.log('Navigating to the main page...');
    await page.goto('https://www.aishamosque.org/', { waitUntil: 'networkidle2' });
    console.log('Main page loaded successfully');

    // Attendre que l'iframe soit chargé
    await page.waitForSelector('iframe', { timeout: 30000 });
    const frameHandle = await page.$('iframe');
    const frame = await frameHandle.contentFrame();

    if (!frame) {
      throw new Error("Unable to access iframe content (possibly due to cross-origin restrictions).");
    }

    // Attendre que la date et les horaires soient chargés
    await frame.waitForSelector('.mbx-widget-timetable-nav-date', { timeout: 15000 });
    await frame.waitForSelector('.styles__Item-sc-1h272ay-1', { timeout: 15000 });

    const data = await frame.evaluate(() => {
      const times = {};

      // Utiliser la date système
      const dateText = new Date().toISOString().split('T')[0]; // Format "YYYY-MM-DD"

      const prayerItems = document.querySelectorAll('.styles__Item-sc-1h272ay-1');

      prayerItems.forEach((item) => {
        const titleElement = item.querySelector('.title');
        const timeElement = item.querySelector('.time.mono');

        if (titleElement && timeElement) {
          let prayerName = titleElement.textContent.trim().toLowerCase();

          // Normalisation des noms de prières
          if (prayerName === 'zuhr') prayerName = 'dhuhr';
          if (prayerName === 'dhuhr') prayerName = 'dhuhr';
          if (prayerName === 'jummah' || prayerName === "jumu'ah") prayerName = 'jumuah';

          const allowedPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

          if (allowedPrayers.includes(prayerName)) {
            let timeText = timeElement.textContent.trim();

            // Remplacer les séparateurs par un deux-points si nécessaire
            timeText = timeText.replace('•', ':');

            // Utiliser une expression régulière pour formater le temps
            const regex = /^(\d{1,2})(\d{2})(AM|PM)?$/i;
            const match = timeText.match(regex);

            if (match) {
              const hours = parseInt(match[1], 10);
              const minutes = match[2];
              const ampm = match[3] ? ` ${match[3].toUpperCase()}` : '';
              const formattedTime = `${hours}:${minutes}${ampm}`;
              times[prayerName] = formattedTime;
            } else {
              times[prayerName] = timeText;
            }
          }
        }
      });

      return { dateText, times };
    });

    if (!data) {
      throw new Error("Data could not be extracted.");
    }

    console.log('Date extraite:', data.dateText);
    console.log('Horaires extraits:', data.times);

    return data;
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = scrapeAishaMosque;
