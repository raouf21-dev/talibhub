// Back-End/scrapers/birmingham/qubaIsmalicCenterBham.js
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

const scrapeQubaIsmalicCenter = async () => {
    let browser;
    let page;

    try {
        console.log('Démarrage du scraping Quba Islamic Center...');

        browser = await puppeteer.launch({
            headless: true,
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

        console.log('Navigation en cours...');

        await page.goto('https://mawaqit.net/en/quba-islamic-cultural-centre-birmingham-b7-4ny-united-kingdom/', {
            waitUntil: 'domcontentloaded',
            timeout: 25000,
        });

        await Promise.all([
            humanBehavior.randomDelay(100, 200),
            humanBehavior.simulateScroll(page)
        ]);

        console.log('Attente du chargement des éléments...');
        await page.waitForSelector('div.prayers', { timeout: 15000 });
        await page.waitForFunction(
            () => document.querySelectorAll('div.prayers > div').length > 0,
            { timeout: 10000 }
        );

        await humanBehavior.moveMouseRandomly(page, 'div.prayers');

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
                    const baseTime = timeElement.textContent.trim();
                    const offset = waitElement ? waitElement.textContent.trim() : null;

                    prayerTimes[prayerName] = {
                        baseTime: baseTime,
                        offset: offset
                    };
                }
            });
            
            return prayerTimes;
        });

        console.log('Données brutes extraites:', rawTimes);

        console.log('Normalisation des données...');

        // Normalisation avec priorité à l'offset
        const normalizedTimes = {};
        for (let [prayer, data] of Object.entries(rawTimes)) {
            prayer = prayerUtils.standardizePrayerName(prayer);
            if (prayer) {
                // Si l'offset est une heure jamaah complète (ex: "07:00"), utiliser cette heure
                if (data.offset && data.offset.match(/^\d{1,2}:\d{2}$/)) {
                    normalizedTimes[prayer] = normalizeTime(data.offset);
                }
                // Si l'offset est au format +X minutes ou nul, utiliser le baseTime
                else {
                    normalizedTimes[prayer] = normalizeTime(data.baseTime);
                }
            }
        }

        const result = {
            source: 'Quba Islamic Center Birmingham',
            date: dateUtils.getUKDate(),
            times: normalizedTimes
        };

        const standardizedResult = prayerUtils.normalizeResult(result);
        console.log('Données normalisées:', standardizedResult);
        return standardizedResult;

    } catch (error) {
        console.error('Erreur lors du scraping de Quba Islamic Center:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé');
        }
    }
};

module.exports = scrapeQubaIsmalicCenter;