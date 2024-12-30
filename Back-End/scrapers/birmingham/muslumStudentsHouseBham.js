// Back-End/scrapers/birmingham/muslumStudentsHouseBham.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const {
 normalizeTime,
 randomDelay,
 getDefaultBrowserConfig,
 setupBasicBrowserPage,
 setupChromiumPath,
 cloudflareUtils,
 safeNavigation,
 errorUtils,
 dateUtils,
 prayerUtils
} = require('./scrapers/scraperUtils');

// Configuration StealthPlugin
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');

puppeteer.use(stealth);

const scrapeMSHUK = async () => {
 let browser;
 try {
   console.log('Démarrage du scraping MSHUK...');

   const launchOptions = {
     ...getDefaultBrowserConfig(),
     executablePath: await setupChromiumPath()
   };

   browser = await puppeteer.launch(launchOptions);
   const page = await setupBasicBrowserPage(browser);

   console.log('Navigation vers MSHUK...');
   await safeNavigation(page, 'https://www.mshuk.org/', {
     retries: 2,
     timeout: 25000,
     waitUntil: 'domcontentloaded',
     validate: async () => {
       // Vérifie Cloudflare
       if (await cloudflareUtils.detect(page)) {
         console.log('Protection Cloudflare détectée, tentative de contournement...');
         await cloudflareUtils.wait(page);
       }
       // Attend et vérifie le contenu
       await page.waitForSelector('.section-prayer-horizontal-times', {
         timeout: 15000,
         visible: true
       });
       return true;
     },
     onError: async (error, retryCount) => {
       console.log(`Tentative ${retryCount} échouée:`, error.message);
       if (retryCount === 2) {
         await errorUtils.saveFailedPage(page, 'failed_mshuk.html');
       }
     }
   });

   console.log('Extraction des données...');
   const rawData = await page.evaluate(() => {
     const prayers = {};
     const prayerItems = document.querySelectorAll('.section-prayer-horizontal-times-item');
     
     prayerItems.forEach(item => {
       const nameElement = item.querySelector('span');
       const jamaatElement = item.querySelector('div:last-child');
       
       if (nameElement && jamaatElement) {
         const name = nameElement.textContent.trim().toLowerCase();
         const time = jamaatElement.textContent.trim();
         
         if (name && time) {
           prayers[name] = time;
         }
       }
     });
     
     return prayers;
   });

   // Normalise les temps et standardise les noms de prière
   const normalizedTimes = {};
   for (let [prayer, time] of Object.entries(rawData)) {
     prayer = prayerUtils.standardizePrayerName(prayer);
     const normalizedTime = normalizeTime(time);
     if (normalizedTime) {
       normalizedTimes[prayer] = normalizedTime;
     }
   }

   const result = {
     source: 'MSHUK',
     date: dateUtils.getUKDate(),
     times: normalizedTimes
   };

   // Standardise le format de sortie
   const standardizedResult = prayerUtils.normalizeResult(result);
   console.log('Données extraites avec succès:', standardizedResult);
   return standardizedResult;

 } catch (error) {
   errorUtils.logScrapingError('MSHUK', error);
   throw error;
 } finally {
   if (browser) {
     await browser.close();
     console.log('Navigateur fermé');
   }
 }
};

module.exports = scrapeMSHUK;