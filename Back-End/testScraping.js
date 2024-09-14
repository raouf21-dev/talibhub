// Back-End/scrapers/Walsall/aishamosque.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { parse, format } = require('date-fns');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const scrapeAishaMosque = async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: false }); // Mode non-headless pour le débogage
    const page = await browser.newPage();

    // Définir le User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)');

    // Naviguer vers la page principale
    await page.goto('https://www.aishamosque.org/', { waitUntil: 'networkidle2' });
    console.log('Page loaded successfully');

    // Attendre que l'iframe soit présent
    await page.waitForSelector('iframe', { timeout: 30000 });
    console.log('Iframe found.');

    // Sélectionner l'iframe
    const iframeElement = await page.$('iframe');
    if (!iframeElement) {
      throw new Error('Iframe element not found');
    }

    // Accéder au contenu de l'iframe
    const iframe = await iframeElement.contentFrame();
    if (!iframe) {
      throw new Error('Cannot find iframe content frame');
    }
    console.log('Iframe content frame accessed.');

    // Attendre que l'élément contenant les horaires soit chargé dans l'iframe
    await iframe.waitForSelector('.styles_Wrapper-sc-1h272ay-0.iUwiLo', { timeout: 30000 });
    console.log('Prayer times container found inside iframe.');

    // Prendre une capture d'écran de l'iframe pour débogage
    await iframe.screenshot({ path: 'iframe_screenshot.png', fullPage: true });
    console.log('Iframe screenshot taken.');

    // Enregistrer le contenu HTML de l'iframe pour inspection
    const iframeContent = await iframe.content();
    fs.writeFileSync('iframe_page.html', iframeContent);
    console.log('Iframe content saved to iframe_page.html.');

    // Extraire la date grégorienne
    const dateText = await iframe.evaluate(() => {
      const dateElement = document.querySelector('.mbx-widget-timetable-nav-date .mbx-widget-timetable-nav-miladi');
      return dateElement ? dateElement.textContent.trim() : null;
    });
    console.log('Date Text:', dateText);

    if (!dateText) {
      throw new Error('Date element not found or date text is empty');
    }

    // Parser la date
    const parsedDate = parse(dateText, 'EEEE, MMMM d, yyyy', new Date());
    if (isNaN(parsedDate)) {
      throw new Error(`Invalid date constructed from dateText: "${dateText}"`);
    }

    const formattedDate = format(parsedDate, 'yyyy-MM-dd');
    console.log('Formatted Date:', formattedDate);

    // Extraire les heures de prière
    const times = await iframe.evaluate(() => {
      const prayerItems = document.querySelectorAll('.styles_Wrapper-sc-1h272ay-0.iUwiLo .styles_Item-sc-1h272ay-1');
      const prayerTimes = {};

      prayerItems.forEach(item => {
        const titleElement = item.querySelector('.title');
        const hourElement = item.querySelector('.time');
        const minuteElement = item.querySelector('.styles_Wrapper-sc-1rm9q09-0 ~ text()');
        const ampmElement = item.querySelector('.ampm');

        let title = titleElement ? titleElement.textContent.trim().toLowerCase() : null;
        let hour = hourElement ? hourElement.textContent.trim() : null;
        let minute = null;
        let ampm = ampmElement ? ampmElement.textContent.trim() : null;

        // Extraire les minutes à partir du nœud de texte suivant
        const minuteNode = hourElement ? hourElement.nextSibling : null;
        if (minuteNode && minuteNode.nodeType === Node.TEXT_NODE) {
          minute = minuteNode.textContent.trim();
        }

        // Formater l'heure
        if (hour && minute && ampm) {
          let hours = parseInt(hour);
          let minutes = parseInt(minute);
          if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
          if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          // Mapper le titre aux clés de prières
          if (title.includes('fajr')) prayerTimes.fajr = formattedTime;
          else if (title.includes('dhuhr') || title.includes('zuhr')) prayerTimes.dhuhr = formattedTime;
          else if (title.includes('asr')) prayerTimes.asr = formattedTime;
          else if (title.includes('maghrib')) prayerTimes.maghrib = formattedTime;
          else if (title.includes('isha')) prayerTimes.isha = formattedTime;
        }
      });

      return prayerTimes;
    });

    console.log('Extracted Times:', times);

    return { date: formattedDate, times };
  } catch (error) {
    console.error('Error scraping Aisha Mosque:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = scrapeAishaMosque;
