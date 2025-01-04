// Back-End/scrapers/birmingham/arRahmaCentreBham.js

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

const stealth = StealthPlugin();
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');

puppeteer.use(stealth);

const scrapeArRahmaCentreBham = async () => {
  let browser;
  let page;
  
  try {
    console.log('Démarrage du scraping Ar-Rahma Centre...');

    const launchOptions = {
      ...getDefaultBrowserConfig(),
      executablePath: await setupChromiumPath()
    };

    browser = await puppeteer.launch(launchOptions);
    page = await setupBasicBrowserPage(browser);

    console.log('Navigation vers Ar-Rahma Centre...');
    await safeNavigation(page, 'https://arrahmacentre.com/', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    console.log('Page principale chargée avec succès');

    await page.waitForSelector('table', { timeout: 20000 });
    console.log('Tableau trouvé, recherche des horaires...');

    console.log('Extraction des données...');
    const times = await page.evaluate(() => {
      const prayerTimes = {};
      const allowedPrayers = ['fajr', 'zuhr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      
      const tables = document.querySelectorAll('table');
      let prayerTable;

      for (const table of tables) {
        if (table.textContent.toLowerCase().includes('fajr')) {
          prayerTable = table;
          break;
        }
      }

      if (!prayerTable) return null;

      const rows = prayerTable.querySelectorAll('tr');
      
      rows.forEach(row => {
        const prayerCell = row.querySelector('th');
        const jamaahCell = row.querySelector('td:last-child');
        
        if (prayerCell && jamaahCell) {
          const prayerName = prayerCell.textContent.trim().toLowerCase();
          const jamaahTime = jamaahCell.textContent.trim();
          
          if (allowedPrayers.includes(prayerName)) {
            prayerTimes[prayerName] = jamaahTime;
          }
        }
      });
      
      return prayerTimes;
    });

    if (!times || Object.keys(times).length === 0) {
      throw new Error('Aucun horaire de prière trouvé');
    }

    console.log('Données brutes extraites:', times);

    const normalizedTimes = {};
    for (let [prayer, time] of Object.entries(times)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      const normalizedTime = normalizeTime(time);
      if (normalizedTime) {
        normalizedTimes[prayer] = normalizedTime;
      }
    }

    console.log('Temps normalisés:', normalizedTimes);

    const result = {
      source: 'Ar-Rahma Centre',
      date: dateUtils.getUKDate(),
      times: normalizedTimes
    };

    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log('Données extraites avec succès:', standardizedResult);
    return standardizedResult;

  } catch (error) {
    errorUtils.logScrapingError('Ar-Rahma Centre', error);
    if (browser && page) {
      await errorUtils.saveFailedPage(page, 'failed_arrahma_centre.html');
    }
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = scrapeArRahmaCentreBham;