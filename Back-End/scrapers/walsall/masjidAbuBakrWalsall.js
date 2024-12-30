// Back-End/scrapers/walsall/masjidAbuBakrWalsall.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const {
 normalizeTime,
 randomDelay,
 getDefaultBrowserConfig,
 setupBasicBrowserPage,
 setupChromiumPath,
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

const scrapeMasjidAbuBakrWalsall = async () => {
 let browser;
 try {
   console.log('Démarrage du scraping Masjid Abu Bakr...');
   
   const launchOptions = {
     ...getDefaultBrowserConfig(),
     executablePath: await setupChromiumPath()
   };

   browser = await puppeteer.launch(launchOptions);
   const page = await setupBasicBrowserPage(browser);

   console.log('Navigation vers Masjid Abu Bakr...');
   await page.goto('https://mosquefinder.co.uk/masjid-abu-bakr-walsall/salaah-timings', {
     waitUntil: 'networkidle2',
     timeout: 30000
   });

   // Attend que le tableau de prières soit chargé
   await page.waitForSelector('table.tw.widget-timming', { timeout: 30000 });
   await randomDelay(1000, 2000);

   console.log('Extraction des données...');
   const data = await page.evaluate(() => {
     const times = {};
     const prayerRows = document.querySelectorAll('table.tw.widget-timming tbody tr');

     prayerRows.forEach((row) => {
       const cells = row.querySelectorAll('td');
       if (cells.length >= 3) {
         let prayerName = cells[0].textContent.trim().toLowerCase();
         let time = cells[2].textContent.trim();

         const [timeStr, period] = time.split(/\s+/);
         if (!timeStr) return;

         const [hours, minutes] = timeStr.split(/[:.]/);
         if (!hours || !minutes) return;

         let hour = parseInt(hours);
         if (isNaN(hour)) return;
         
         if (period === 'PM' && hour < 12) hour += 12;
         if (period === 'AM' && hour === 12) hour = 0;
         
         times[prayerName] = `${hour}:${minutes}`;
       }
     });
     
     return times;
   });

   // Normalise les temps et standardise les noms de prière
   const normalizedTimes = {};
   for (let [prayer, time] of Object.entries(data)) {
     prayer = prayerUtils.standardizePrayerName(prayer);
     const normalizedTime = normalizeTime(time);
     if (normalizedTime) {
       normalizedTimes[prayer] = normalizedTime;
     }
   }

   const result = {
     source: 'Masjid Abu Bakr Walsall',
     date: dateUtils.getUKDate(),
     times: normalizedTimes
   };

   // Standardise le format de sortie
   const standardizedResult = prayerUtils.normalizeResult(result);
   console.log('Données extraites avec succès:', standardizedResult);
   return standardizedResult;

 } catch (error) {
   errorUtils.logScrapingError('Masjid Abu Bakr', error);
   if (browser) {
     await errorUtils.saveFailedPage(page, 'failed_masjid_abu_bakr.html');
   }
   throw error;
 } finally {
   if (browser) {
     await browser.close();
     console.log('Navigateur fermé');
   }
 }
};

module.exports = scrapeMasjidAbuBakrWalsall;