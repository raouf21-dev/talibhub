// masjidAbuBakrWalsall.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Intégration du plugin Stealth pour masquer les signes d'automatisation
puppeteer.use(StealthPlugin());

// Liste des User Agents pour rotation
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  // Ajoutez d'autres User Agents si nécessaire
];

// Fonction pour ajouter des délais aléatoires
const randomDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));

const scrapeMasjidAbuBakrWalsall = async () => {
  let browser;
  try {
    // Sélectionner un User Agent aléatoire
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    browser = await puppeteer.launch({ 
      headless: true, // Mode headless pour exécution discrète et rapide
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled' // Désactiver certaines fonctionnalités de détection
      ]
    });
    const page = await browser.newPage();

    // Définir un User Agent aléatoire
    await page.setUserAgent(randomUserAgent);

    // Définir le viewport
    await page.setViewport({ width: 1280, height: 800 });
    await page.setJavaScriptEnabled(true);

    // Masquer le webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Supprimer les propriétés spécifiques au navigateur utilisées pour la détection
      const newProto = navigator.__proto__;
      delete newProto.webdriver;
    });

    console.log('Navigation vers la page principale...');
    await page.goto('https://mosquefinder.co.uk/masjid-abu-bakr-walsall/salaah-timings', { waitUntil: 'networkidle2' });
    console.log('Page principale chargée avec succès');

    // Simuler des mouvements de souris et des délais aléatoires pour imiter un comportement humain
    await page.mouse.move(100, 100);
    await randomDelay(100, 300);
    await page.mouse.move(200, 200);
    await randomDelay(100, 300);
    await page.mouse.move(300, 300);
    await randomDelay(100, 300);

    // Attendre que la table des horaires de prières soit chargée
    await page.waitForSelector('table.tw.widget-timming', { timeout: 30000 });

    const data = await page.evaluate(() => {
      const result = {};

      // Extraction de la date (grégorienne) si disponible
      const dateElement = document.querySelector('div.prayer-slider p.text-center.mb-1');
      if (dateElement) {
        result.gregorianDate = dateElement.textContent.trim();
      }

      // Extraction des horaires des prières
      const prayerRows = document.querySelectorAll('table.tw.widget-timming tbody tr');
      
      prayerRows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          let prayerName = cells[0].textContent.trim().toLowerCase();
          const prayerTime = cells[2].textContent.trim(); // Extraire le temps depuis le 3ème <td> (class text-right)

          // Normalisation des noms de prières
          if (prayerName === 'duhr' || prayerName === 'dhuhr') {
            prayerName = 'zuhr';
          } else if (prayerName === 'jummah' || prayerName === "jumu'ah") {
            prayerName = 'jumuah';
          }

          const allowedPrayers = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];

          if (allowedPrayers.includes(prayerName)) {
            // Assurer que le temps est au format "HH:MM"
            const regex = /^(\d{1,2}):(\d{2})$/;
            const match = prayerTime.match(regex);

            if (match) {
              const hours = parseInt(match[1], 10);
              const minutes = match[2];
              const formattedTime = `${hours}:${minutes}`;
              result[prayerName] = formattedTime;
            } else {
              // Si le format ne correspond pas, utiliser le texte brut
              result[prayerName] = prayerTime;
            }
          }
        }
      });

      return result;
    });

    if (!data || Object.keys(data).length === 0) {
      throw new Error("Les données n'ont pas pu être extraites.");
    }

    return data;
  } catch (error) {
    console.error('Erreur lors du scraping :', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// Si vous souhaitez exécuter ce script directement, décommentez les lignes ci-dessous :

/*(async () => {
  const data = await scrapeMasjidAbuBakrWalsall();
  console.log('Horaires des prières:', data);
})();*/

module.exports = scrapeMasjidAbuBakrWalsall;
