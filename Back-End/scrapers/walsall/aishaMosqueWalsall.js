//Back-End/scrapers/walsall/aishaMosqueWalsall.js

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
 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.111 Safari/537.36',
 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15',
 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:116.0) Gecko/20100101 Firefox/116.0'
];

// Fonction utilitaire pour normaliser le format de l'heure
const normalizeTime = (timeStr) => {
  if (!timeStr || timeStr === 'NaN:undefined') return null;
  
  // Retire tous les caractères non numériques sauf ':'
  timeStr = timeStr.replace(/[^0-9:]/g, '');
  
  // Gère le cas où l'heure est au format HHMM
  if (!timeStr.includes(':')) {
    timeStr = timeStr.padStart(4, '0');
    timeStr = `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
  }
  
  // S'assure que les heures et minutes sont sur 2 chiffres
  const [hours, minutes] = timeStr.split(':');
  if (!hours || !minutes) return null;
  
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

let isScrapingInProgress = false;

const scrapeAishaMosque = async () => {
 // Évite les scraping simultanés
 if (isScrapingInProgress) {
   console.log('Un scraping est déjà en cours, attente...');
   return null;
 }
 
 isScrapingInProgress = true;
 let browser;

 try {
   console.log('Démarrage du scraping...');
   const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

   const launchOptions = {
     headless: true,
     executablePath: '/snap/bin/chromium',
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

   browser = await puppeteer.launch(launchOptions);
   const page = await browser.newPage();

   await page.setUserAgent(randomUserAgent);
   await page.setDefaultNavigationTimeout(45000);
   await page.setViewport({ width: 1024, height: 768 });

   console.log('Navigation vers Aisha Mosque...');
   await page.goto('https://www.aishamosque.org/', { waitUntil: 'networkidle2' });
   console.log('Page principale chargée avec succès');

   await page.waitForSelector('iframe', { timeout: 30000 });
   const frameHandle = await page.$('iframe');
   const frame = await frameHandle.contentFrame();

   if (!frame) {
     throw new Error("Unable to access iframe content (possibly due to cross-origin restrictions).");
   }

   await frame.waitForSelector('.mbx-widget-timetable-nav-date', { timeout: 15000 });
   await frame.waitForSelector('.styles__Item-sc-1h272ay-1', { timeout: 15000 });

   console.log('Extraction des données...');
   const ukTime = DateTime.now().setZone('Europe/London');
   const dateText = ukTime.toISODate();

   const times = await frame.evaluate(() => {
     const prayerTimes = {};
     const prayerItems = document.querySelectorAll('.styles__Item-sc-1h272ay-1');

     prayerItems.forEach((item) => {
       const titleElement = item.querySelector('.title');
       const timeElement = item.querySelector('.time.mono');

       if (titleElement && timeElement) {
         let prayerName = titleElement.textContent.trim().toLowerCase();
         let timeText = timeElement.textContent.trim();

         if (prayerName === 'zuhr') prayerName = 'dhuhr';

         const allowedPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

         if (allowedPrayers.includes(prayerName)) {
           const regex = /^(\d{1,2})(\d{2})(AM|PM)?$/i;
           const match = timeText.match(regex);

           if (match) {
             let hours = parseInt(match[1], 10);
             const minutes = match[2];
             const period = match[3] ? match[3].toUpperCase() : '';

             if (period === 'PM' && hours < 12) hours += 12;
             if (period === 'AM' && hours === 12) hours = 0;

             prayerTimes[prayerName] = `${hours}:${minutes}`;
           } else {
             timeText = timeText.replace(/[^0-9]/g, '');
             if (timeText.length === 3 || timeText.length === 4) {
               const hours = parseInt(timeText.slice(0, timeText.length - 2), 10);
               const minutes = timeText.slice(-2);
               prayerTimes[prayerName] = `${hours}:${minutes}`;
             }
           }
         }
       }
     });

     return prayerTimes;
   });

   // Normalise tous les temps avant de les renvoyer
   const normalizedTimes = {};
   for (const [prayer, time] of Object.entries(times)) {
     const normalizedTime = normalizeTime(time);
     if (normalizedTime) {
       normalizedTimes[prayer] = normalizedTime;
     }
   }

   const result = {
     source: 'Aisha Mosque Walsall',
     date: dateText,
     times: normalizedTimes
   };

   console.log('Données extraites avec succès:', result);
   return result;

 } catch (error) {
   console.error('Erreur lors du scraping:', error);
   throw error;
 } finally {
   if (browser) {
     await browser.close();
     console.log('Navigateur fermé');
   }
   isScrapingInProgress = false;
 }
};


module.exports = scrapeAishaMosque;