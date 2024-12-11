const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer'); 
const { DateTime } = require('luxon');
const fs = require('fs');

// Configuration StealthPlugin
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');

puppeteer.use(stealth);

const userAgents = [
 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:115.0) Gecko/20100101 Firefox/115.0',
 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15',
 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
 'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Mobile Safari/537.36',
];

const randomDelay = (min, max) =>
 new Promise((resolve) =>
   setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
 );

const scrapeGreenLaneMasjidBham = async () => {
 let browser;
 try {
   console.log('Démarrage du scraping...');
   const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

   const launchOptions = {
     headless: true,
     args: [
       '--no-sandbox',
       '--disable-setuid-sandbox',
       '--disable-dev-shm-usage',
       '--disable-gpu',
       '--disable-blink-features=AutomationControlled',
       '--disable-features=IsolateOrigins,site-per-process',
       '--window-size=1024,768',
     ],
     ignoreHTTPSErrors: true,
   };

   try {
     if (fs.existsSync('/usr/bin/chromium-browser')) {
       console.log('Utilisation de Chromium système');
       launchOptions.executablePath = '/usr/bin/chromium-browser';
     } else {
       console.log('Utilisation de Chromium Puppeteer');
       launchOptions.executablePath = executablePath();
     }
   } catch (error) {
     console.log('Fallback sur Chromium Puppeteer');
     launchOptions.executablePath = executablePath();
   }

   browser = await puppeteer.launch(launchOptions);
   const page = await browser.newPage();

   await page.setUserAgent(randomUserAgent);
   await page.setViewport({ width: 1024, height: 768 });
   await page.setJavaScriptEnabled(true);

   await page.setRequestInterception(true);
   page.on('request', (request) => {
     const resourceType = request.resourceType();
     if (['image', 'stylesheet', 'font'].includes(resourceType)) {
       request.abort();
     } else {
       request.continue();
     }
   });

   await page.evaluateOnNewDocument(() => {
     Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
   });

   let retryCount = 0;
   const maxRetries = 2;

   while (retryCount < maxRetries) {
     try {
       console.log('Navigation vers Green Lane Masjid...');
       await page.goto('https://greenlanemasjid.org/', { 
         waitUntil: 'domcontentloaded', 
         timeout: 25000 
       });
       console.log('Page chargée avec succès');

       await page.waitForSelector('table tbody tr', { timeout: 20000, visible: true });

       const rows = await page.$$eval('table tbody tr', rows => rows.length);
       if (rows > 0) {
         console.log('Contenu valide détecté');
         break;
       } else {
         throw new Error('Tableau des prières vide');
       }
     } catch (error) {
       retryCount++;
       console.log(`Tentative ${retryCount}/${maxRetries} échouée:`, error.message);
       if (retryCount === maxRetries) {
         const content = await page.content();
         fs.writeFileSync('failed_page.html', content);
         console.log('Le contenu de la page a été sauvegardé dans failed_page.html pour analyse.');
         throw error;
       }
       await randomDelay(3000, 5000);
     }
   }

   console.log('Extraction des données...');
   const ukTime = DateTime.now().setZone('Europe/London');
   const dateText = ukTime.toISODate();

   const times = await page.evaluate(() => {
     const prayerTimes = {};
     const rows = document.querySelectorAll('table tbody tr');

     rows.forEach((row) => {
       const prayerName = row.querySelector('.prayer_time')?.textContent.trim().toLowerCase();
       if (!prayerName) return;

       const cells = row.querySelectorAll('td');
       if (cells.length >= 4) {
         const jamaahTime = cells[3].textContent.trim() || cells[2].textContent.trim();
         
         if (jamaahTime) {
           const timeStr = jamaahTime.trim();
           const [time, period] = timeStr.split(' ');
           const [hours, minutes] = time.split(':');
           let hour = parseInt(hours);
           
           if (period === 'PM' && hour < 12) hour += 12;
           if (period === 'AM' && hour === 12) hour = 0;
           
           const formattedTime = `${hour.toString().padStart(2, '0')}:${minutes}`;

           switch (prayerName) {
             case 'fajr':
               prayerTimes.fajr = formattedTime;
               break;
             case 'dhuhr':
             case 'zuhr':
               prayerTimes.dhuhr = formattedTime;
               break;
             case 'asr':
               prayerTimes.asr = formattedTime;
               break;
             case 'maghrib':
               prayerTimes.maghrib = formattedTime;
               break;
             case 'isha':
               prayerTimes.isha = formattedTime;
               break;
           }
         }
       }
     });
     
     return prayerTimes;
   });

   const result = {
     source: 'Green Lane Masjid Birmingham',
     date: dateText,
     times: times
   };

   console.log('Données extraites avec succès:', result);
   return result;

 } catch (error) {
   console.error('Erreur lors du scraping :', error);
   throw error;
 } finally {
   if (browser) {
     await browser.close();
     console.log('Navigateur fermé');
   }
 }
};

module.exports = scrapeGreenLaneMasjidBham;