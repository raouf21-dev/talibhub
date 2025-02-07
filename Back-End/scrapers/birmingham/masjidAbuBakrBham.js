//Probleme maghreb 

// Back-End/scrapers/birmingham/masjidAbuBakrBham.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const {
   normalizeTime,
   dateUtils,
   prayerUtils, 
   userAgents
} = require('../scraperUtils');
const humanBehavior = require('../humanBehaviorUtils');

const stealth = StealthPlugin();
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');
puppeteer.use(stealth);

const scrapeAbuBakr = async () => {
   let browser;
   let page;

   try {
       console.log('Démarrage du scraping Masjid-e-Abu Bakr...');

       browser = await puppeteer.launch({
           headless: 'new',
           args: [
               '--no-sandbox',
               '--disable-setuid-sandbox',
               '--disable-dev-shm-usage',
               '--disable-gpu',
               '--window-size=1920,1080'
           ],
           ignoreHTTPSErrors: true,
           executablePath: await executablePath()
       });

       page = await browser.newPage();
       await humanBehavior.setupPageOptimized(page);
       await page.setViewport({ width: 1920, height: 1080 });
       const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
       await page.setUserAgent(randomUserAgent);

       await page.setRequestInterception(true);
       page.on('request', request => {
           const resourceType = request.resourceType();
           if (['image', 'stylesheet', 'font'].includes(resourceType)) {
               request.abort();
           } else {
               request.continue();
           }
       });

       await page.goto('https://abubakrbillesley.co.uk/', {
           waitUntil: 'networkidle2',
           timeout: 30000
       });

       await Promise.all([
           humanBehavior.randomDelay(100, 200),
           humanBehavior.simulateScroll(page),
           page.waitForSelector('table tbody', { timeout: 30000 })
       ]);

       const rawTimes = await page.evaluate(() => {
           const prayerTimes = {};
           const rows = document.querySelectorAll('table tbody tr');
           
           rows.forEach(row => {
               const prayerCell = row.querySelector('td:first-child');
               const timeCell = row.querySelector('td:last-child');
               
               if (prayerCell && timeCell) {
                   const prayerName = prayerCell.textContent.trim().toLowerCase();
                   const time = timeCell.textContent.trim();
                   
                   // Ignorer les lignes de jumu'ah
                   if (!prayerName.includes('jumu')) {
                       prayerTimes[prayerName] = time;
                   }
               }
           });

           return prayerTimes;
       });

       console.log('Données brutes extraites:', rawTimes);

       const normalizedTimes = {};
       for (let [prayer, time] of Object.entries(rawTimes)) {
           prayer = prayerUtils.standardizePrayerName(prayer);
           if (prayer) {
               const normalizedTime = normalizeTime(time);
               if (normalizedTime) {
                   normalizedTimes[prayer] = normalizedTime;
               }
           }
       }

       const result = {
           source: 'Masjid-e-Abu Bakr Birmingham',
           date: dateUtils.getUKDate(),
           times: normalizedTimes
       };

       const standardizedResult = prayerUtils.normalizeResult(result);
       console.log('Données normalisées:', standardizedResult);
       return standardizedResult;

   } catch (error) {
       console.error('Erreur lors du scraping de Masjid-e-Abu Bakr :', error);
       throw error;
   } finally {
       if (browser) {
           await browser.close();
           console.log('Navigateur fermé');
       }
   }
};

module.exports = scrapeAbuBakr;