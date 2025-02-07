// Back-End/scrapers/birmingham/masjidEsaIbnMaryamaBham.js
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

const scrapeEsaIbnMaryama = async () => {
   let browser;
   let page;

   try {
       console.log('Démarrage du scraping Esa ibn Maryama...');

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

       await page.goto('https://arrahma.co.uk/', {
           waitUntil: 'networkidle2',
           timeout: 30000
       });

       await page.waitForSelector('.customStyles', { timeout: 15000 });

       const rawTimes = await page.evaluate(() => {
           const prayerTimes = {};
           const prayers = ['fajr', 'zuhr', 'asr', 'maghrib'];

           // Partie 1 : Extraire Fajr, Zuhr, Asr et Maghrib depuis les cellules "jamah" du premier tableau
           const jamahTimes = document.querySelectorAll('td.jamah');
           jamahTimes.forEach((cell, index) => {
               if (index < prayers.length) {
                   const time = cell.textContent.trim();
                   if (time && !time.includes('-')) {
                       prayerTimes[prayers[index]] = time;
                   }
               }
           });

           // Partie 2 : Extraire Isha depuis le deuxième tableau, en prenant la dernière ligne et la dernière cellule de celle-ci
           const tables = document.querySelectorAll('table');
           if (tables.length > 1) {
               const secondTable = tables[1];
               const ishaRow = secondTable.querySelector('tr:last-child');
               if (ishaRow) {
                   const cells = ishaRow.querySelectorAll('td');
                   if (cells.length > 0) {
                       const ishaTime = cells[cells.length - 1].textContent.trim();
                       if (ishaTime && !ishaTime.includes('-')) {
                           prayerTimes['isha'] = ishaTime;
                       }
                   }
               }
           } else {
               console.error("Le deuxième tableau n'a pas été trouvé.");
           }

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
           source: 'Masjid Esa ibn Maryama Birmingham',
           date: dateUtils.getUKDate(),
           times: normalizedTimes
       };

       const standardizedResult = prayerUtils.normalizeResult(result);
       console.log('Données normalisées:', standardizedResult);
       return standardizedResult;

   } catch (error) {
       console.error('Erreur lors du scraping de Esa ibn Maryama:', error);
       throw error;
   } finally {
       if (browser) {
           await browser.close();
           console.log('Navigateur fermé');
       }
   }
};

module.exports = scrapeEsaIbnMaryama;
