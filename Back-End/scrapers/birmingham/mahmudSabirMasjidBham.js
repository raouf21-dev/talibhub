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

const scrapeMahmudSabirMasjid = async () => {
    let browser;
    let page;

    try {
        console.log('Démarrage du scraping MahmudSabir Al Furqan Masjid...');

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

        console.log('Navigation en cours...');

        await page.goto('https://mawaqit.net/en/mahmudsabir-al-furqan-masjid-birmingham-b11-3bz-united-kingdom', {
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
                    // Récupération directe du temps dans le div wait (format: HH:mm)
                    const jamahTime = waitElement ? waitElement.textContent.trim() : null;

                    prayerTimes[prayerName] = {
                        baseTime: baseTime,
                        jamahTime: jamahTime
                    };
                }
            });
            
            return prayerTimes;
        });

        console.log('Données brutes extraites:', rawTimes);

        console.log('Normalisation des données...');

        // Normalisation avec priorité aux horaires Jamah
        const normalizedTimes = {};
        for (let [prayer, data] of Object.entries(rawTimes)) {
            prayer = prayerUtils.standardizePrayerName(prayer);
            if (prayer) {
                // On utilise le temps Jamah s'il est disponible
                const timeToNormalize = data.jamahTime || data.baseTime;
                const normalizedTime = normalizeTime(timeToNormalize);
                if (normalizedTime) {
                    normalizedTimes[prayer] = normalizedTime;
                }
            }
        }

        const result = {
            source: 'MahmudSabir Al Furqan Masjid Birmingham',
            date: dateUtils.getUKDate(),
            times: normalizedTimes
        };

        const standardizedResult = prayerUtils.normalizeResult(result);
        console.log('Données normalisées:', standardizedResult);
        return standardizedResult;

    } catch (error) {
        console.error('Erreur lors du scraping de MahmudSabir Al Furqan Masjid:', error);
        if (page) {
        }
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé');
        }
    }
};

module.exports = scrapeMahmudSabirMasjid; 