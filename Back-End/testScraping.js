// masjidAlfarouqWalsall.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { DateTime } = require('luxon'); // Importer luxon

puppeteer.use(StealthPlugin());

const userAgents = [
  // Navigateur Chrome sur Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)' +
    ' Chrome/114.0.0.0 Safari/537.36',
  // Navigateur Firefox sur Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0',
  // Navigateur Safari sur macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)' +
    ' Version/15.1 Safari/605.1.15',
  // Navigateur Safari sur iPhone
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)' +
    ' Version/15.5 Mobile/15E148 Safari/604.1',
  // Navigateur Chrome sur Android
  'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/99.0.4844.74 Mobile Safari/537.36',
];

const randomDelay = (min, max) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );

const scrapeMasjidAlFarouq = async () => {
  let browser;
  try {
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
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
    // ... autres mouvements si nécessaire

    await page.waitForSelector('div.my-5', { timeout: 30000 });

    // Calculer isFriday en fonction du fuseau horaire du Royaume-Uni
    const ukTime = DateTime.now().setZone('Europe/London');
    const isFriday = ukTime.weekday === 5; // 5 correspond à vendredi dans luxon
    const dateText = ukTime.toISODate(); // Obtenir la date au format 'AAAA-MM-JJ'

    const data = await page.evaluate(
      (isFriday, dateText) => {
        const times = {};
        // Utiliser dateText passé depuis Node.js

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

            // Normalisation des noms de prières pour correspondre aux noms des colonnes de la base de données
            switch (prayerName) {
              case 'fajr':
                prayerName = 'fajr';
                break;
              case 'zuhr':
              case 'dhuhr':
                prayerName = 'dhuhr';
                break;
              case 'asr':
                prayerName = 'asr';
                break;
              case 'maghrib':
                prayerName = 'maghrib';
                break;
              case 'isha':
                prayerName = 'isha';
                break;
              default:
                prayerName = null;
            }

            if (prayerName) {
              times[prayerName] = prayerTime;
            }
          }
        });

        if (isFriday) {
          // Fonction pour normaliser le texte et gérer les différentes apostrophes
          const normalizeText = (text) =>
            text.replace(/[\u2019\u0027]/g, "'").trim().toLowerCase();

          const h2Elements = document.querySelectorAll('h2');
          let jumuahTimesSection = null;

          for (let h2 of h2Elements) {
            const text = normalizeText(h2.textContent);
            if (text.includes("jumu'ah times")) {
              jumuahTimesSection = h2;
              break;
            }
          }

          if (jumuahTimesSection) {
            const jumuahDiv = jumuahTimesSection.parentElement; // Le div contenant le h2

            const liElements = jumuahDiv.querySelectorAll('ul li');

            liElements.forEach((liElement, index) => {
              // Extraire l'heure du 'p' élément
              const pElements = liElement.querySelectorAll('p');
              pElements.forEach((pElement) => {
                const textContent = pElement.textContent.trim();
                const timeMatch = textContent.match(/(\d{1,2}:\d{2})/);
                if (timeMatch) {
                  const prayerTime = timeMatch[1];
                  const prayerName = `jumuah${index + 1}`; // Correspond aux colonnes jumuah1, jumuah2, etc.
                  times[prayerName] = prayerTime;
                }
              });
            });
          }
        }

        return { dateText, times };
      },
      isFriday,
      dateText
    );

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
