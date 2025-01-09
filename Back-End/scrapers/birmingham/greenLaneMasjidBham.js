// Back-End/scrapers/birmingham/greenLaneMasjidBham.js
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

const validatePage = async (page) => {
    try {
        await page.waitForSelector('table tbody tr', { timeout: 20000, visible: true });
        const rows = await page.$$eval('table tbody tr', rows => rows.length);
        return rows > 0;
    } catch (error) {
        return false;
    }
};

const scrapeGreenLaneMasjidBham = async () => {
    let browser;
    let page;

    try {
        console.log('Démarrage du scraping Green Lane Masjid...');

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

        // Configuration anti-détection optimisée
        await humanBehavior.setupPageOptimized(page);
        await page.setViewport({ width: 1920, height: 1080 });
        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        await page.setUserAgent(randomUserAgent);

        // Configuration spécifique pour Green Lane Masjid
        await page.setJavaScriptEnabled(true);
        await page.setRequestInterception(true);

        // Optimisation des ressources
        page.on('request', request => {
            const resourceType = request.resourceType();
            if (['image', 'stylesheet', 'font'].includes(resourceType)) {
                request.abort();
            } else {
                request.continue();
            }
        });

        console.log('Navigation en cours...');

        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount < maxRetries) {
            try {
                await page.goto('https://greenlanemasjid.org/', {
                    waitUntil: 'domcontentloaded',
                    timeout: 25000
                });

                // Simulation rapide de comportement humain
                await Promise.all([
                    humanBehavior.randomDelay(100, 200),
                    humanBehavior.simulateScroll(page)
                ]);

                if (await validatePage(page)) {
                    console.log('Page chargée avec succès');
                    break;
                } else {
                    throw new Error('Contenu de la page non valide');
                }
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    await page.screenshot({ path: 'failed_greenlane_masjid.png' });
                    throw error;
                }
                console.log(`Tentative ${retryCount}/${maxRetries}`);
                await humanBehavior.randomDelay(2000, 3000);
            }
        }

        // Simulation de mouvement de souris vers le tableau
        await humanBehavior.moveMouseRandomly(page, 'table tbody');

        console.log('Extraction des horaires en cours...');

        const rawTimes = await page.evaluate(() => {
            const prayerTimes = {};
            const rows = document.querySelectorAll('table tbody tr');

            rows.forEach((row) => {
                const prayerName = row.querySelector('.prayer_time')?.textContent.trim().toLowerCase();
                if (!prayerName) return;

                const cells = row.querySelectorAll('td');
                if (cells.length >= 4) {
                    const jamaahTime = cells[3].textContent.trim() || cells[2].textContent.trim();
                    if (jamaahTime) {
                        prayerTimes[prayerName] = jamaahTime;
                    }
                }
            });
            
            return prayerTimes;
        });

        if (!rawTimes || Object.keys(rawTimes).length === 0) {
            throw new Error('Aucun horaire de prière trouvé');
        }

        console.log('Normalisation des données...');

        const normalizedTimes = {};
        for (let [prayer, time] of Object.entries(rawTimes)) {
            prayer = prayerUtils.standardizePrayerName(prayer);
            const normalizedTime = normalizeTime(time);
            if (normalizedTime) {
                normalizedTimes[prayer] = normalizedTime;
            }
        }

        const result = {
            source: 'Green Lane Masjid Birmingham',
            date: dateUtils.getUKDate(),
            times: normalizedTimes
        };

        const standardizedResult = prayerUtils.normalizeResult(result);

        console.log('Données extraites avec succès:', standardizedResult);
        return standardizedResult;

    } catch (error) {
        console.error('Erreur lors du scraping de Green Lane Masjid:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé');
        }
    }
};

module.exports = scrapeGreenLaneMasjidBham;