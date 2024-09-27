// masjidAlfarouqWalsall.js

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

const scrapeMasjidAlFarouq = async () => {
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
    await page.goto('https://www.masjidalfarouq.org.uk/', { waitUntil: 'networkidle2' });
    console.log('Page principale chargée avec succès');

    // Simuler des mouvements de souris et des délais aléatoires pour imiter un comportement humain
    await page.mouse.move(100, 100);
    await randomDelay(100, 300);
    await page.mouse.move(200, 200);
    await randomDelay(100, 300);
    await page.mouse.move(300, 300);
    await randomDelay(100, 300);

    // Attendre que la section des horaires de prières soit chargée
    await page.waitForSelector('div.my-5', { timeout: 30000 });

    const data = await page.evaluate(() => {
      const result = {};

      // Extraction de la date grégorienne
      const gregorianDateElement = document.querySelector('div.border-b.rounded-t-lg.py-3.px-4.md\\:py-4.md\\:px-5 h2.text-md3-headline-medium.sm\\:text-md3-headline-large.font-bold.font-elMessiri');
      const gregorianDate = gregorianDateElement ? gregorianDateElement.textContent.trim() : null;

      // Extraction de la date hijri
      const hijriDateElement = document.querySelector('div.border-b.rounded-t-lg.py-3.px-4.md\\:py-4.md\\:px-5 p.mt-1.text-sm');
      const hijriDate = hijriDateElement ? hijriDateElement.textContent.trim() : null;

      if (gregorianDate) {
        result.gregorianDate = gregorianDate;
      }

      if (hijriDate) {
        result.hijriDate = hijriDate;
      }

      // Extraction des horaires des prières
      const prayerElements = document.querySelectorAll(
        'div.my-5 div.flex.flex-row.justify-around.items-center.flex-wrap.mt-2 div.flex.flex-col.items-center.max-w-xs.flex'
      );

      prayerElements.forEach((prayerElement) => {
        const nameElement = prayerElement.querySelector('h3.font-elMessiri.font-medium.text-md3-body-large.sm\\:text-md3-headline-medium');
        
        // Sélectionner tous les <h4> et prendre le deuxième
        const h4Elements = prayerElement.querySelectorAll('h4.p-0\\.5.sm\\:p-1.font-medium');
        const timeElement = h4Elements.length >= 2 ? h4Elements[1] : null;

        if (nameElement && timeElement) {
          let prayerName = nameElement.textContent.trim().toLowerCase();

          // Normalisation des noms de prières
          if (prayerName === 'dhuhr') prayerName = 'zuhr';
          if (prayerName === 'jummah' || prayerName === "jumu'ah") prayerName = 'jumuah';

          const allowedPrayers = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];

          if (allowedPrayers.includes(prayerName)) {
            let timeText = timeElement.textContent.trim();

            // Assurer que le temps est au format "HH:MM"
            const regex = /^(\d{1,2}):(\d{2})$/;
            const match = timeText.match(regex);

            if (match) {
              const hours = parseInt(match[1], 10);
              const minutes = match[2];
              const formattedTime = `${hours}:${minutes}`;
              result[prayerName] = formattedTime;
            } else {
              // Si le format ne correspond pas, utiliser le texte brut
              result[prayerName] = timeText;
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

//(async () => {
//  const data = await scrapeMasjidAlFarouq();
//  console.log('Horaires des prières:', data);
//})();


module.exports = scrapeMasjidAlFarouq;

