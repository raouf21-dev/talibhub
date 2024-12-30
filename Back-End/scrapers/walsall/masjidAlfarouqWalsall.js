// Back-End/scrapers/walsall/masjidAlfarouqWalsall.js

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

const scrapeMasjidAlFarouq = async () => {
 let browser;
 try {
   console.log('Démarrage du scraping Masjid Al-Farouq...');

   const launchOptions = {
     ...getDefaultBrowserConfig(),
     executablePath: await setupChromiumPath()
   };

   browser = await puppeteer.launch(launchOptions);
   const page = await setupBasicBrowserPage(browser);

   await setupResourceInterception(page);

   console.log('Navigation vers Masjid Al-Farouq...');
   await page.goto('https://www.masjidalfarouq.org.uk/', {
     waitUntil: 'domcontentloaded',
     timeout: 25000
   });

   await page.waitForSelector('div.my-5', { timeout: 15000 });
   await randomDelay(1000, 2000);

   console.log('Extraction des données...');
   const data = await page.evaluate(() => {
     const times = {};
     const prayerElements = document.querySelectorAll(
       'div.my-5 div.flex.flex-row.justify-around.items-center.flex-wrap.mt-2 div.flex.flex-col.items-center.max-w-xs.flex'
     );

     prayerElements.forEach((prayerElement) => {
       const nameElement = prayerElement.querySelector('h3.font-elMessiri.font-medium');
       const timeElements = prayerElement.querySelectorAll('h4.p-0\\.5.sm\\:p-1.font-medium');
       const timeElement = timeElements.length >= 2 ? timeElements[1] : null;

       if (nameElement && timeElement) {
         let prayerName = nameElement.textContent.trim().toLowerCase();
         let time = timeElement.textContent.trim();

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
     source: 'Masjid Al-Farouq Walsall',
     date: dateUtils.getUKDate(),
     times: normalizedTimes
   };

   // Standardise le format de sortie
   const standardizedResult = prayerUtils.normalizeResult(result);
   console.log('Données extraites avec succès:', standardizedResult);
   return standardizedResult;

 } catch (error) {
   errorUtils.logScrapingError('Masjid Al-Farouq', error);
   if (browser) {
     await errorUtils.saveFailedPage(page, 'failed_masjid_alfarouq.html');
   }
   throw error;
 } finally {
   if (browser) {
     await browser.close();
     console.log('Navigateur fermé');
   }
 }
};

module.exports = scrapeMasjidAlFarouq;