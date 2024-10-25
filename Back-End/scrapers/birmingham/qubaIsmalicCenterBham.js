// scrapeQubaIsmalicCenter.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { DateTime } = require('luxon'); // Importer luxon
const fs = require('fs'); // Pour sauvegarder le contenu de la page en cas d'échec

// Configuration StealthPlugin avec des options optimisées
const stealth = StealthPlugin();

// Désactiver certaines évasions du StealthPlugin pour améliorer les performances
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');
// Vous pouvez ajouter d'autres évasions à désactiver si nécessaire

puppeteer.use(stealth);

// Définir plusieurs user agents
const userAgents = [
  // Navigateur Chrome sur Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  // Navigateur Firefox sur Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0',
  // Navigateur Safari sur macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
  // Navigateur Safari sur iPhone
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
  // Navigateur Chrome sur Android
  'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Mobile Safari/537.36',
  // Cinq user agents supplémentaires
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.111 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:116.0) Gecko/20100101 Firefox/116.0',
];

// Fonction pour générer un délai aléatoire
const randomDelay = (min, max) =>
  new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );

// Fonction principale de scraping
const scrapeQubaIsmalicCenter = async () => {
  let browser;
  try {
    console.log('Démarrage du scraping...');
    // Sélectionner un user agent aléatoire
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    browser = await puppeteer.launch({
      headless: true, // Mode headless pour la vitesse
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=800,600', // Taille de viewport réduite
      ],
    });

    const page = await browser.newPage();

    // Définir le user agent sélectionné
    await page.setUserAgent(randomUserAgent);

    // Réduire la taille du viewport
    await page.setViewport({ width: 800, height: 600 });

    // Activer l'interception des requêtes pour bloquer les ressources non essentielles
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

    let frame; // Déclarer frame ici pour qu'il soit accessible en dehors de la boucle

    while (retryCount < maxRetries) {
      try {
        console.log('Navigation vers la page principale...');
        await page.goto('https://mawaqit.net/en/quba-islamic-cultural-centre-birmingham-b7-4ny-united-kingdom/', {
          waitUntil: 'domcontentloaded', // Utiliser domcontentloaded pour accélérer
          timeout: 25000, // Timeout réduit
        });
        console.log('Page principale chargée avec succès');

        // Simuler des mouvements de souris et des délais aléatoires
        // Minimiser les mouvements et les délais pour accélérer
        await page.mouse.move(100, 100);
        await randomDelay(50, 150);

        // Attendre que l'élément principal soit chargé
        await page.waitForSelector('div.prayers', { timeout: 15000 });

        // Accéder au contenu de la page
        frame = page; // Si le contenu n'est pas dans une iframe, utiliser la page principale

        // Si le contenu est dans une iframe, décommentez les lignes suivantes
        /*
        const frameHandle = await page.$('iframe');
        frame = await frameHandle.contentFrame();

        if (!frame) {
          throw new Error("Impossible d'accéder au contenu de l'iframe (possiblement à cause de restrictions cross-origin).");
        }
        */

        // Attendre que les éléments de prière soient chargés
        await frame.waitForSelector('div.prayers', { timeout: 10000 });

        // Vérifier si les éléments attendus sont présents
        const hasContent = await frame.evaluate(() => {
          return document.querySelectorAll('div.prayers > div').length > 0;
        });

        if (hasContent) {
          console.log('Contenu valide détecté');
          break; // Sortir de la boucle si le contenu est trouvé
        } else {
          throw new Error("Contenu de la page non valide");
        }
      } catch (error) {
        retryCount++;
        console.log(`Tentative ${retryCount}/${maxRetries} échouée:`, error.message);
        if (retryCount === maxRetries) {
          // Sauvegarder le contenu de la page pour diagnostic
          const content = await page.content();
          fs.writeFileSync('failed_page_qubaIslamicCenter.html', content);
          console.log('Le contenu de la page a été sauvegardé dans failed_page_qubaIslamicCenter.html pour analyse.');
          throw error;
        }
        await randomDelay(3000, 5000); // Délais entre les tentatives
      }
    }

    // Vérifier que frame est défini avant de continuer
    if (!frame) {
      throw new Error("Frame non défini après les tentatives");
    }

    console.log('Extraction des données...');
    const ukTime = DateTime.now().setZone('Europe/London');
    const dateText = ukTime.toISODate();

    const data = await frame.evaluate(
      (dateText) => {
        const times = {};

        const prayerElements = document.querySelectorAll('div.prayers > div');

        prayerElements.forEach((prayerElement) => {
          const nameElement = prayerElement.querySelector('div.name');
          const timeElement = prayerElement.querySelector('div.time');
          const waitElement = prayerElement.querySelector('div.wait > div');

          if (nameElement && timeElement) {
            let prayerName = nameElement.textContent.trim().toLowerCase();
            let prayerTime = timeElement.textContent.trim();
            let waitText = waitElement ? waitElement.textContent.trim() : '+0'; // Si waitElement est absent, supposer '+0'

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
              // Vérifier si waitText est un offset ou une heure spécifique
              if (/^\+\d+$/.test(waitText)) {
                // Offset en minutes
                const offsetMinutes = parseInt(waitText.replace('+', ''), 10);
                const [hours, minutes] = prayerTime.split(':').map(Number);
                const date = new Date();
                date.setHours(hours, minutes, 0, 0);
                date.setMinutes(date.getMinutes() + offsetMinutes);
                const adjustedHours = date.getHours().toString().padStart(2, '0');
                const adjustedMinutes = date.getMinutes().toString().padStart(2, '0');
                prayerTime = `${adjustedHours}:${adjustedMinutes}`;
              } else if (/^\d{1,2}:\d{2}$/.test(waitText)) {
                // Heure spécifique
                prayerTime = waitText;
              }
              times[prayerName] = prayerTime;
            }
          }
        });

        return { dateText, times };
      },
      dateText
    );

    if (!data || Object.keys(data.times).length === 0) {
      throw new Error("Les données n'ont pas pu être extraites.");
    }

    console.log('Date extraite :', data.dateText);
    console.log('Horaires extraits :', data.times);

    return data;
  } catch (error) {
    console.error('Erreur lors du scraping :', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navigateur fermé');
    }
  }
};


module.exports = scrapeQubaIsmalicCenter;
