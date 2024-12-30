// Back-End/scrapers/birmingham/qubaIsmalicCenterBham.js

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
} = require('./scrapers/scraperUtils');

// Configuration StealthPlugin
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');

puppeteer.use(stealth);

const scrapeQubaIsmalicCenter = async () => {
  let browser;
  try {
    console.log('Démarrage du scraping...');

    const launchOptions = {
      ...getDefaultBrowserConfig(),
      executablePath: await setupChromiumPath()
    };

    browser = await puppeteer.launch(launchOptions);
    const page = await setupBasicBrowserPage(browser);

    await setupResourceInterception(page);

    console.log('Navigation vers Quba Islamic Center...');
    await page.goto('https://mawaqit.net/en/quba-islamic-cultural-centre-birmingham-b7-4ny-united-kingdom/', {
      waitUntil: 'domcontentloaded',
      timeout: 25000,
    });

    // Simulation de mouvements de souris pour éviter la détection
    await page.mouse.move(100, 100);
    await randomDelay(50, 150);

    // Attend que les éléments nécessaires soient chargés
    await page.waitForSelector('div.prayers', { timeout: 15000 });
    await page.waitForFunction(
      () => document.querySelectorAll('div.prayers > div').length > 0,
      { timeout: 10000 }
    );

    console.log('Extraction des données...');
    const rawTimes = await page.evaluate(() => {
      const prayerTimes = {};
      const prayerElements = document.querySelectorAll('div.prayers > div');

      prayerElements.forEach((prayerElement) => {
        const nameElement = prayerElement.querySelector('div.name');
        const timeElement = prayerElement.querySelector('div.time');
        const waitElement = prayerElement.querySelector('div.wait > div');

        if (nameElement && timeElement) {
          let prayerName = nameElement.textContent.trim().toLowerCase();
          const prayerTime = timeElement.textContent.trim();
          const waitText = waitElement ? waitElement.textContent.trim() : '+0';

          prayerTimes[prayerName] = {
            baseTime: prayerTime,
            offset: waitText
          };
        }
      });
      
      return prayerTimes;
    });

    // Normalise les temps en tenant compte des délais
    const normalizedTimes = {};
    for (let [prayer, data] of Object.entries(rawTimes)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      let offsetMinutes = 0;
      if (/^\+\d+$/.test(data.offset)) {
        offsetMinutes = parseInt(data.offset.replace('+', ''), 10);
      }
      
      const normalizedTime = normalizeTime(data.baseTime, offsetMinutes);
      if (normalizedTime) {
        normalizedTimes[prayer] = normalizedTime;
      }
    }

    const result = {
      source: 'Quba Islamic Center Birmingham',
      date: dateUtils.getUKDate(),
      times: normalizedTimes
    };

    // Standardise le format de sortie
    const standardizedResult = prayerUtils.normalizeResult(result);
    console.log('Données extraites avec succès:', standardizedResult);
    return standardizedResult;

  } catch (error) {
    errorUtils.logScrapingError('Quba Islamic Center', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navigateur fermé');
    }
  }
};

module.exports = scrapeQubaIsmalicCenter;