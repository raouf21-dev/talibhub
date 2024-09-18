const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const scrapeAishaMosque = async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 ...');

    console.log('Navigating to the main page...');
    await page.goto('https://www.aishamosque.org/', { waitUntil: 'networkidle2' });
    console.log('Main page loaded successfully');

    // Attendre l'iframe
    await page.waitForSelector('iframe', { timeout: 30000 });
    const frameHandle = await page.$('iframe');
    const frame = await frameHandle.contentFrame();

    // Attendre un élément spécifique à l'intérieur de l'iframe pour s'assurer que le contenu est chargé
    await frame.waitForSelector('.mbx-widget-timetable-nav-date .mbx-widget-timetable-nav-miladi', { timeout: 30000 });

    // Extraire les données de l'iframe
    const data = await frame.evaluate(() => {
      const dateElement = document.querySelector('.mbx-widget-timetable-nav-date .mbx-widget-timetable-nav-miladi');
      const dateText = dateElement ? dateElement.textContent.trim() : null;

      const formatTime = (hourElement, minuteElement, ampmElement) => {
        if (!hourElement || !ampmElement) return null;
        const hourText = hourElement.textContent.trim();
        const minuteText = minuteElement ? minuteElement.textContent.trim() : '00';
        const ampmText = ampmElement.textContent.trim();

        let hours = parseInt(hourText);
        let minutes = parseInt(minuteText);
        if (ampmText.toLowerCase() === 'pm' && hours < 12) hours += 12;
        if (ampmText.toLowerCase() === 'am' && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };

      const getPrayerTime = (prayerName) => {
        const item = Array.from(document.querySelectorAll('.title')).find(el => el.textContent.trim().toLowerCase() === prayerName);
        if (item) {
          const parent = item.closest('.styles_Item-sc-1h272ay-1');
          const hourElement = parent.querySelector('.time.mono');
          const minuteElement = hourElement.nextElementSibling;
          const ampmElement = parent.querySelector('.ampm');
          return formatTime(hourElement, minuteElement, ampmElement);
        }
        return null;
      };

      const times = {
        fajr: getPrayerTime('fajr'),
        dhuhr: getPrayerTime('dhuhr'),
        asr: getPrayerTime('asr'),
        maghrib: getPrayerTime('maghrib'),
        isha: getPrayerTime('isha'),
        jumuah1: getPrayerTime("jumu'ah")
      };

      return { dateText, times };
    });

    console.log('Date:', data.dateText);
    console.log('Prayer Times:', data.times);

    return data;
  } catch (error) {
    console.error('Error scraping Aisha Mosque:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// Exporter la fonction sans l'appeler immédiatement
module.exports = scrapeAishaMosque;
