// Back-End/scrapers/walsall/masjidAlfarouqWalsall.js
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

const scrapeMasjidAlFarouq = async () => {
    let browser;
    let page;

    try {
        console.log('Démarrage du scraping Masjid Al-Farouq...');

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

        // Optimisation des ressources
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

        await page.goto('https://www.masjidalfarouq.org.uk/', {
            waitUntil: 'domcontentloaded',
            timeout: 25000
        });

        // Actions parallèles pour l'efficacité
        await Promise.all([
            page.waitForSelector('div.my-5', { timeout: 15000 }),
            humanBehavior.randomDelay(100, 200),
            humanBehavior.simulateScroll(page)
        ]);

        // Simulation de mouvement de souris
        await humanBehavior.moveMouseRandomly(page, 'div.my-5');

        console.log('Extraction des données...');
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
                    
                    // Garder le format brut pour la normalisation
                    if (time) {
                        times[prayerName] = time;
                    }
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
            source: 'Masjid Al-Farouq Walsall',
            date: dateUtils.getUKDate(),
            times: normalizedTimes
        };

        const standardizedResult = prayerUtils.normalizeResult(result);
        console.log('Données normalisées:', standardizedResult);
        return standardizedResult;

    } catch (error) {
        console.error('Erreur lors du scraping de Masjid Al-Farouq:', error);
        if (page) {
            await page.screenshot({ path: 'failed_masjid_alfarouq.png' });
        }
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé');
        }
    }
};

module.exports = scrapeMasjidAlFarouq;