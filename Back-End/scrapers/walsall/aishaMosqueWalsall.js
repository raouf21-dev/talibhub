//aishaMosqueWalsall.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const scrapeAishaMosque = async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
    );

    console.log('Navigating to the main page...');
    await page.goto('https://www.aishamosque.org/', { waitUntil: 'networkidle2' });
    console.log('Main page loaded successfully');

    // Attendre que l'iframe spécifique soit chargé
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
      const dateElement = document.querySelector('.mbx-widget-timetable-nav-date');
      const dateText = dateElement ? dateElement.textContent.trim() : null;

      const times = {};

      const prayerItems = document.querySelectorAll('.styles__Item-sc-1h272ay-1');

      prayerItems.forEach((item) => {
        const titleElement = item.querySelector('.title');
        const timeElement = item.querySelector('.time.mono');

        if (titleElement && timeElement) {
          let prayerName = titleElement.textContent.trim().toLowerCase();

          // Normalisation des noms de prières
          if (prayerName === 'dhuhr') prayerName = 'zuhr';
          if (prayerName === 'jummah' || prayerName === "jumu'ah") prayerName = 'jumuah';

          const allowedPrayers = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];

          if (allowedPrayers.includes(prayerName)) {
            // Extraction directe du texte complet du temps
            let timeText = timeElement.textContent.trim();

            // Remplacer les séparateurs par un deux-points si nécessaire
            timeText = timeText.replace('•', ':');

            // Utiliser une expression régulière pour formater le temps
            // Exemple : '615AM' => '6:15 AM' ou '6:15'
            const regex = /^(\d{1,2})(\d{2})(AM|PM)?$/i;
            const match = timeText.match(regex);

            if (match) {
              const hours = parseInt(match[1], 10);
              const minutes = match[2];
              const ampm = match[3] ? ` ${match[3].toUpperCase()}` : '';

              // Format souhaité : '6:15 AM' ou '6:15'
              const formattedTime = `${hours}:${minutes}${ampm}`;

              // Si vous souhaitez omettre AM/PM, utilisez :
              // const formattedTime = `${hours}:${minutes}`;

              times[prayerName] = formattedTime;
            } else {
              // Si le format ne correspond pas, utiliser le texte brut après remplacement
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

    console.log('Date:', data.dateText);
    console.log('Prayer times:', data.times);

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
