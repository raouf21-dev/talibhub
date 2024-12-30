// Back-End/scrapers/birmingham/centralMosqueBham.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const { DateTime } = require('luxon');
const fs = require('fs');
const { 
  normalizeTime, 
  randomDelay, 
  getDefaultBrowserConfig, 
  getDefaultHeaders, 
  setupBasicBrowserPage 
} = require('../scraperUtils');

// Configuration StealthPlugin
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');
puppeteer.use(stealth);

const waitForCloudflare = async (page) => {
  try {
    await page.waitForFunction(
      () => {
        return !document.querySelector('#challenge-running') &&
               !document.querySelector('#cf-spinner') &&
               !document.querySelector('.cf-browser-verification');
      },
      { timeout: 15000 }
    );
    await randomDelay(1000, 1500);
  } catch (error) {
    console.log('Erreur lors de l\'attente Cloudflare:', error.message);
    throw new Error('Impossible de passer la protection Cloudflare');
  }
};

const scrapeCentralMosque = async () => {
  let browser;
  try {
    console.log('Démarrage du scraping...');
    
    const launchOptions = {
      ...getDefaultBrowserConfig(),
      executablePath: '/snap/bin/chromium',
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
    const page = await setupBasicBrowserPage(browser);

    console.log('Navigation vers Central Mosque...');

    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount < maxRetries) {
      try {
        const response = await page.goto('http://centralmosque.org.uk/', {
          waitUntil: 'domcontentloaded',
          timeout: 25000
        });

        if (response.status() === 520 || response.status() === 403) {
          console.log(`Statut de réponse ${response.status()}, tentative de contournement Cloudflare...`);
          await waitForCloudflare(page);
        }

        const content = await page.content();
        if (content.includes('mptt-wrapper-container')) {
          console.log('Page chargée avec succès');
          break;
        } else {
          throw new Error('Contenu de la page non valide');
        }
      } catch (error) {
        retryCount++;
        console.log(`Tentative ${retryCount}/${maxRetries} échouée:`, error.message);
        if (retryCount === maxRetries) throw error;
        await randomDelay(3000, 5000);
      }
    }

    console.log('Attente des éléments de prière...');
    await page.waitForSelector('.mptt-wrapper-container', { 
      timeout: 15000,
      visible: true 
    });

    const ukTime = DateTime.now().setZone('Europe/London');
    const dateText = ukTime.toISODate();

    console.log('Extraction des données...');
    const data = await page.evaluate(() => {
      const prayers = {};
      const prayerElements = document.querySelectorAll('.prayer-time');

      prayerElements.forEach(element => {
        const titleElement = element.querySelector('.mptt-sec-title');
        const jamaatElement = element.querySelector('.prayer-jamaat');

        if (titleElement && jamaatElement) {
          let title = titleElement.textContent.trim().toLowerCase();
          const jamaatTime = jamaatElement.textContent.trim();

          if (title === 'zuhr') {
            title = 'dhuhr';
          }

          prayers[title] = jamaatTime;
        }
      });

      return prayers;
    });

    // Normalise tous les temps avant de les renvoyer
    const normalizedTimes = {};
    for (const [prayer, time] of Object.entries(data)) {
      const normalizedTime = normalizeTime(time);
      if (normalizedTime) {
        normalizedTimes[prayer] = normalizedTime;
      }
    }

    const result = {
      source: 'Central Mosque Birmingham',
      date: dateText,
      times: normalizedTimes
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

module.exports = scrapeCentralMosque;