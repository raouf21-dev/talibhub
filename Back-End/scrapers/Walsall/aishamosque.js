// Back-End/scrapers/Walsall/aishamosque.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { parse, format } = require('date-fns');
const fs = require('fs');

puppeteer.use(StealthPlugin());

const scrapeAishaMosque = async () => {
  let browser;
  try {
    // Lancer Puppeteer en mode non-headless pour le débogage
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Définir un User-Agent standard
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

    // Définir la résolution de l'écran
    await page.setViewport({ width: 1280, height: 800 });

    // Écouter les messages de console de la page
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });

    // Écouter les erreurs réseau
    page.on('requestfailed', request => {
      console.log(`Request failed: ${request.url()} ${request.failure().errorText}`);
    });

    // Gérer les dialogues (alertes, confirmations, etc.)
    page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept(); // Accepter l'alerte
    });

    // Naviguer vers la page principale de la mosquée (ajustez l'URL si nécessaire)
    console.log('Navigating to the main page...');
    await page.goto('https://www.aishamosque.org/', { waitUntil: 'networkidle2' });
    console.log('Page loaded successfully');

    // Attendre que l'iframe soit présent (ajustez le sélecteur si nécessaire)
    console.log('Waiting for iframe...');
    await page.waitForSelector('iframe', { timeout: 30000 }); // Timeout augmenté à 30 secondes
    console.log('Iframe found.');

    // Sélectionner l'iframe
    const iframeElement = await page.$('iframe'); // Ajustez le sélecteur si plusieurs iframes
    if (!iframeElement) {
      throw new Error('Iframe element not found');
    }

    // Accéder au contenu de l'iframe
    const iframe = await iframeElement.contentFrame();
    if (!iframe) {
      throw new Error('Cannot find iframe content frame');
    }
    console.log('Iframe content frame accessed.');

    // Attendre que l'élément contenant la date soit chargé dans l'iframe
    console.log('Waiting for date selector inside iframe...');
    await iframe.waitForSelector('.mbx-widget-timetable-nav-date .mbx-widget-timetable-nav-miladi', { timeout: 30000 });
    console.log('Date selector found inside iframe.');

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
      const formatTime = (timeString) => {
        if (!timeString) return null;
        const match = timeString.match(/(\d{1,2})(?::(\d{2}))?(?:\s*(AM|PM))?/i);
        if (match) {
          let [, hours, minutes, period] = match;
          hours = parseInt(hours);
          minutes = minutes ? parseInt(minutes) : 0;
          if (period && period.toLowerCase() === 'pm' && hours < 12) hours += 12;
          if (period && period.toLowerCase() === 'am' && hours === 12) hours = 0;
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return null;
      };

      const getTime = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : null;
      };

      return {
        fajr: formatTime(getTime('.styles__Item-sc-1h272ay-1.gZMDuh .time')),
        dhuhr: formatTime(getTime('.styles__Item-sc-1h272ay-1.gZMDuh .time:nth-of-type(3)')),
        asr: formatTime(getTime('.styles__Item-sc-1h272ay-1.gZMDuh .time:nth-of-type(4)')),
        maghrib: formatTime(getTime('.styles__Item-sc-1h272ay-1.gZMDuh .time:nth-of-type(5)')),
        isha: formatTime(getTime('.styles__Item-sc-1h272ay-1.gZMDuh .time:nth-of-type(6)')),
        jumuah1: formatTime(getTime('.mbx-widget-jumuah .athan-time'))
      };
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
