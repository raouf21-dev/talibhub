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

const randomDelay = async (min, max) => {
 const delay = Math.floor(Math.random() * (max - min + 1)) + min;
 await new Promise(resolve => setTimeout(resolve, delay));
};

const scrapeMasjidAlFarouq = async () => {
 let browser;
 try {
   console.log('Démarrage du scraping Masjid Al-Farouq...');
   const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

   const launchOptions = {
    headless: true,
    executablePath: '/snap/bin/chromium',  // Chemin fixe vers Chromium snap
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080',
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
   
   await page.setDefaultNavigationTimeout(45000);
   await page.setViewport({ width: 1920, height: 1080 });
   await page.setUserAgent(randomUserAgent);
   
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
     delete Object.getPrototypeOf(navigator).webdriver;
     Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
     Object.defineProperty(navigator, 'productSub', { get: () => '20100101' });
     Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
     window.navigator.chrome = { runtime: {} };
   });

   console.log('Navigation vers Masjid Al-Farouq...');
   await page.goto('https://www.masjidalfarouq.org.uk/', {
     waitUntil: 'domcontentloaded',
     timeout: 25000
   });

   await page.waitForSelector('div.my-5', { timeout: 15000 });
   await randomDelay(1000, 2000);

   console.log('Extraction des données...');
   const ukTime = DateTime.now().setZone('Europe/London');
   const dateText = ukTime.toISODate();

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

         switch (prayerName) {
           case 'fajr': prayerName = 'fajr'; break;
           case 'zuhr':
           case 'dhuhr': prayerName = 'dhuhr'; break;
           case 'asr': prayerName = 'asr'; break;
           case 'maghrib': prayerName = 'maghrib'; break;
           case 'isha': prayerName = 'isha'; break;
           default: prayerName = null;
         }

         if (prayerName) {
           const [timeStr, period] = time.split(/\s+/);
           const [hours, minutes] = timeStr.split(/[:.]/);
           let hour = parseInt(hours);
           
           if (period === 'PM' && hour < 12) hour += 12;
           if (period === 'AM' && hour === 12) hour = 0;
           
           times[prayerName] = `${hour.toString().padStart(2, '0')}:${minutes}`;
         }
       }
     });
     
     return times;
   });

   const result = {
     source: 'Masjid Al-Farouq Walsall',
     date: dateText,
     times: data
   };

   console.log('Données extraites avec succès:', result);
   return result;

 } catch (error) {
   console.error('Erreur détaillée lors du scraping:', error);
   throw new Error(`Erreur de scraping: ${error.message}`);
 } finally {
   if (browser) {
     await browser.close();
     console.log('Navigateur fermé');
   }
 }
};

module.exports = scrapeMasjidAlFarouq;