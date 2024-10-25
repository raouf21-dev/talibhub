// greenLaneMasjidBham.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { DateTime } = require('luxon');
const fs = require('fs'); // Pour sauvegarder le contenu de la page en cas d'échec

// Configuration StealthPlugin avec des options optimisées
const stealth = StealthPlugin();

// Désactiver certaines évasions du StealthPlugin pour améliorer les performances
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');
// Vous pouvez ajouter d'autres évasions à désactiver si nécessaire

puppeteer.use(stealth);

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Mobile Safari/537.36',
];

const randomDelay = (min, max) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );

const scrapeGreenLaneMasjidBham = async () => {
  let browser;
  try {
    console.log('Démarrage du scraping...');
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    browser = await puppeteer.launch({
      headless: true, // Passez à 'false' pour le débogage visuel
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1024,768', // Réduit la taille du viewport
      ],
    });
    const page = await browser.newPage();

    await page.setUserAgent(randomUserAgent);
    await page.setViewport({ width: 1024, height: 768 }); // Viewport réduit
    await page.setJavaScriptEnabled(true);

    // Bloquer les ressources non essentielles pour accélérer le chargement
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Masquer le webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    let retryCount = 0;
    const maxRetries = 2; // Nombre maximal de tentatives

    while (retryCount < maxRetries) {
      try {
        console.log('Navigation vers Green Lane Masjid...');
        await page.goto('https://greenlanemasjid.org/', { waitUntil: 'domcontentloaded', timeout: 25000 });
        console.log('Page chargée avec succès');

        // Attendre que le tableau des prières soit chargé
        await page.waitForSelector('table tbody tr', { timeout: 20000, visible: true });

        // Vérifier si le tableau a des lignes
        const rows = await page.$$eval('table tbody tr', rows => rows.length);
        if (rows > 0) {
          console.log('Contenu valide détecté');
          break; // Sortir de la boucle si le contenu est trouvé
        } else {
          throw new Error('Tableau des prières vide');
        }
      } catch (error) {
        retryCount++;
        console.log(`Tentative ${retryCount}/${maxRetries} échouée:`, error.message);
        if (retryCount === maxRetries) {
          // Sauvegarder le contenu de la page pour diagnostic
          const content = await page.content();
          fs.writeFileSync('failed_page.html', content);
          console.log('Le contenu de la page a été sauvegardé dans failed_page.html pour analyse.');
          throw error;
        }
        await randomDelay(3000, 5000); // Délais entre les tentatives
      }
    }

    // Calculer la date actuelle au Royaume-Uni
    const ukTime = DateTime.now().setZone('Europe/London');
    const dateText = ukTime.toISODate();

    console.log('Extraction des données...');
    const data = await page.evaluate((dateText) => {
      const times = {};
      const rows = document.querySelectorAll('table tbody tr');

      rows.forEach((row) => {
        const prayerName = row.querySelector('.prayer_time')?.textContent.trim().toLowerCase();
        if (!prayerName) return;

        // Obtenir les cellules contenant les horaires
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          // Pour Maghrib, utiliser l'horaire de début si pas d'horaire Jama'ah
          const jamaahTime = cells[3].textContent.trim() || cells[2].textContent.trim();
          
          if (jamaahTime) {
            switch (prayerName) {
              case 'fajr':
                times.fajr = jamaahTime;
                break;
              case 'dhuhr':
                times.dhuhr = jamaahTime;
                break;
              case 'asr':
                times.asr = jamaahTime;
                break;
              case 'maghrib':
                times.maghrib = jamaahTime;
                break;
              case 'isha':
                times.isha = jamaahTime;
                break;
            }
          }
        }
      });

      return { dateText, times };
    }, dateText);

    if (!data || Object.keys(data.times).length === 0) {
      throw new Error("Les données n'ont pas pu être extraites.");
    }

    console.log('Date extraite :', data.dateText);
    console.log('Horaires extraits :', data.times);

    return data;
  } catch (error) {
    console.error('Erreur lors du scraping :', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navigateur fermé');
    }
  }
};

module.exports = scrapeGreenLaneMasjidBham;
