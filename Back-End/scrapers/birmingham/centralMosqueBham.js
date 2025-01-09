// centralMosqueBham.js
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

const scrapeCentralMosque = async () => {
    let browser;
    let page;

    try {
        console.log('Démarrage du scraping Central Mosque...');

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
        
        // Configuration anti-détection optimisée
        await humanBehavior.setupPageOptimized(page);
        
        await page.setViewport({ width: 1920, height: 1080 });
        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        await page.setUserAgent(randomUserAgent);

        console.log('Navigation en cours...');
        
        await page.goto('http://centralmosque.org.uk/', {
            waitUntil: 'domcontentloaded',
            timeout: 25000
        });

        // Simulation rapide de comportement humain
        await Promise.all([
            humanBehavior.randomDelay(100, 200),
            humanBehavior.simulateScroll(page)
        ]);

        await page.waitForSelector('.mptt-wrapper-container', {
            timeout: 15000,
            visible: true
        });

        // Simulation de mouvement de souris vers le tableau des prières
        await humanBehavior.moveMouseRandomly(page, '.mptt-wrapper-container');

        console.log('Extraction des horaires en cours...');

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

        if (!data || Object.keys(data).length === 0) {
            throw new Error('Aucun horaire de prière trouvé');
        }

        console.log('Normalisation des données...');

        const normalizedTimes = {};
        for (let [prayer, time] of Object.entries(data)) {
            prayer = prayerUtils.standardizePrayerName(prayer);
            const normalizedTime = normalizeTime(time);
            if (normalizedTime) {
                normalizedTimes[prayer] = normalizedTime;
            }
        }

        const result = {
            source: 'Central Mosque Birmingham',
            date: dateUtils.getUKDate(),
            times: normalizedTimes
        };

        const standardizedResult = prayerUtils.normalizeResult(result);

        console.log('Données extraites avec succès:', standardizedResult);
        return standardizedResult;

    } catch (error) {
        console.error('Erreur lors du scraping de Central Mosque:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé');
        }
    }
};

module.exports = scrapeCentralMosque;