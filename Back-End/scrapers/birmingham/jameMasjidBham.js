// Back-End/scrapers/birmingham/jameMasjidBham.js
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

const scrapeJameMasjid = async () => {
   let browser;
   let page;
   let frame;

   try {
       console.log('Démarrage du scraping Birmingham Jame Masjid...');

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

       await page.goto('https://www.birminghamjamemasjid.org.uk/', {
           waitUntil: 'networkidle2',
           timeout: 30000
       });

       await Promise.all([
           humanBehavior.randomDelay(100, 200),
           humanBehavior.simulateScroll(page)
       ]);

       await page.waitForSelector('iframe', { timeout: 30000 });
       const frameHandle = await page.$('iframe');
       frame = await frameHandle.contentFrame();

       if (!frame) {
           throw new Error("Impossible d'accéder au contenu de l'iframe");
       }

       await frame.waitForSelector('.title.korolev', { timeout: 15000 });

       const times = await frame.evaluate(() => {
           const prayerTimes = {};
           const prayerElements = document.querySelectorAll('.styles_Item-sc-1h272ay-1');

           prayerElements.forEach(element => {
               const nameSpan = element.querySelector('span[class^="styles-sc-"]');
               const timeMonoElement = element.querySelector('.time.mono');
               
               if (nameSpan && timeMonoElement) {
                   const prayerName = nameSpan.textContent.trim().toLowerCase();
                   
                   // Extraire les heures et minutes
                   const mainTime = timeMonoElement.textContent.trim();
                   const wrapperElement = element.querySelector('.styles_Wrapper-sc-1rm9q09-0');
                   const minutes = wrapperElement ? wrapperElement.textContent.trim() : '';
                   
                   // Assembler l'heure complète
                   const fullTime = `${mainTime}${minutes}`;
                   
                   if (fullTime) {
                       prayerTimes[prayerName] = fullTime;
                   }
               }
           });

           return prayerTimes;
       });

       console.log('Données brutes extraites:', times);

       const normalizedTimes = {};
       for (let [prayer, time] of Object.entries(times)) {
           prayer = prayerUtils.standardizePrayerName(prayer);
           if (prayer) {
               const normalizedTime = normalizeTime(time);
               if (normalizedTime) {
                   normalizedTimes[prayer] = normalizedTime;
               }
           }
       }

       const result = {
           source: 'Birmingham Jame Masjid',
           date: dateUtils.getUKDate(),
           times: normalizedTimes
       };

       const standardizedResult = prayerUtils.normalizeResult(result);
       console.log('Données normalisées:', standardizedResult);
       return standardizedResult;

   } catch (error) {
       console.error('Erreur lors du scraping de Birmingham Jame Masjid:', error);
       throw error;
   } finally {
       if (browser) {
           await browser.close();
           console.log('Navigateur fermé');
       }
   }
};

module.exports = scrapeJameMasjid;