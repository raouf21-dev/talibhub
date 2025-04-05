// Back-End/scrapers/walsall/masjidAbuBakrWalsall.js
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

const scrapeMasjidAbuBakrWalsall = async () => {
    let browser;
    let page;

    try {
        console.log('Démarrage du scraping Masjid Abu Bakr...');

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

        await page.goto('https://mosquefinder.co.uk/masjid-abu-bakr-walsall/salaah-timings', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await Promise.all([
            humanBehavior.randomDelay(100, 200),
            humanBehavior.simulateScroll(page),
            page.waitForSelector('table.tw.widget-timming', { timeout: 30000 })
        ]);

        await humanBehavior.moveMouseRandomly(page, 'table.tw.widget-timming');

        console.log('Extraction des données...');
        const data = await page.evaluate(() => {
            const times = {};
            const prayerRows = document.querySelectorAll('table.tw.widget-timming tbody tr');

            prayerRows.forEach((row) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    let prayerName = cells[0].textContent.trim().toLowerCase();
                    let time = cells[2].textContent.trim();

                    // Garder le format AM/PM pour la normalisation
                    times[prayerName] = time;
                }
            });

            return times;
        });

        console.log('Données brutes extraites:', data);

        console.log('Normalisation des données...');
        
        // Normalisation avec prise en compte du type de prière
        const normalizedTimes = {};
        for (let [prayer, time] of Object.entries(data)) {
            prayer = prayerUtils.standardizePrayerName(prayer);
            if (prayer) {
                const normalizedTime = normalizeTime(time, prayer);
                if (normalizedTime) {
                    normalizedTimes[prayer] = normalizedTime;
                }
            }
        }

        const result = {
            source: 'Masjid Abu Bakr Walsall',
            date: dateUtils.getUKDate(),
            times: normalizedTimes
        };

        const standardizedResult = prayerUtils.normalizeResult(result);
        console.log('Données normalisées:', standardizedResult);
        return standardizedResult;

    } catch (error) {
        console.error('Erreur lors du scraping de Masjid Abu Bakr:', error);
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

module.exports = scrapeMasjidAbuBakrWalsall;