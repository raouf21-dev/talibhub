// Back-End/scrapers/birmingham/greenLaneMasjidBham.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const { 
 normalizeTime,
 randomDelay,
 getDefaultBrowserConfig,
 setupBasicBrowserPage,
 setupChromiumPath, 
 setupResourceInterception,
 safeNavigation,
 errorUtils,
 dateUtils,
 prayerUtils
} = require('../scraperUtils');

// Configuration StealthPlugin
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');

puppeteer.use(stealth);

const scrapeGreenLaneMasjidBham = async () => {
 let browser;
 try {
   console.log('Démarrage du scraping...');

   const launchOptions = {
     ...getDefaultBrowserConfig(),
     executablePath: await setupChromiumPath()
   };

   browser = await puppeteer.launch(launchOptions);
   const page = await setupBasicBrowserPage(browser);

   // Configuration spécifique pour Green Lane Masjid
   await page.setJavaScriptEnabled(true);
   await setupResourceInterception(page);

   console.log('Navigation vers Green Lane Masjid...');
   await safeNavigation(page, 'https://greenlanemasjid.org/', {
     retries: 2,
     timeout: 25000,
     waitUntil: 'domcontentloaded',
     validate: async () => {
       await page.waitForSelector('table tbody tr', { timeout: 20000, visible: true });
       const rows = await page.$$eval('table tbody tr', rows => rows.length);
       return rows > 0;
     },
     onError: async (error, retryCount) => {
       console.log(`Tentative ${retryCount} échouée:`, error.message);
       if (retryCount === 2) {
         await errorUtils.saveFailedPage(page, 'failed_greenlane_masjid.html');
       }
     }
   });

   console.log('Extraction des données...');
   const rawTimes = await page.evaluate(() => {
     const prayerTimes = {};
     const rows = document.querySelectorAll('table tbody tr');

     rows.forEach((row) => {
       const prayerName = row.querySelector('.prayer_time')?.textContent.trim().toLowerCase();
       if (!prayerName) return;

       const cells = row.querySelectorAll('td');
       if (cells.length >= 4) {
         const jamaahTime = cells[3].textContent.trim() || cells[2].textContent.trim();
         if (jamaahTime) {
           prayerTimes[prayerName] = jamaahTime;
         }
       }
     });
     
     return prayerTimes;
   });

   // Normalise les temps et standardise les noms de prière
   const normalizedTimes = {};
   for (let [prayer, time] of Object.entries(rawTimes)) {
     prayer = prayerUtils.standardizePrayerName(prayer);
     const normalizedTime = normalizeTime(time);
     if (normalizedTime) {
       normalizedTimes[prayer] = normalizedTime;
     }
   }

   const result = {
     source: 'Green Lane Masjid Birmingham',
     date: dateUtils.getUKDate(),
     times: normalizedTimes
   };

   // Standardise le format de sortie
   const standardizedResult = prayerUtils.normalizeResult(result);
   console.log('Données extraites avec succès:', standardizedResult);
   return standardizedResult;

 } catch (error) {
   errorUtils.logScrapingError('Green Lane Masjid', error);
   throw error;
 } finally {
   if (browser) {
     await browser.close();
     console.log('Navigateur fermé');
   }
 }
};

module.exports = scrapeGreenLaneMasjidBham;