// Back-End/scrapers/birmingham/sparkbrookMasjidBham.js
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

const scrapeSparkbrookMasjid = async () => {
    let browser;
    let page;

    try {
        console.log('Démarrage du scraping Sparkbrook Masjid...');

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

        await page.goto('https://www.sparkbrookmasjid.co.uk/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await Promise.all([
            humanBehavior.randomDelay(100, 200),
            humanBehavior.simulateScroll(page)
        ]);

        console.log('Attente du chargement des éléments...');
        await page.waitForSelector('table.dptTimetable', { timeout: 15000 });

        await humanBehavior.moveMouseRandomly(page, 'table.dptTimetable');

        console.log('Extraction des données...');
        const rawTimes = await page.evaluate(() => {
            const prayerTimes = {};
            const rows = document.querySelectorAll('table.dptTimetable tr');

            rows.forEach(row => {
                const prayerNameCell = row.querySelector('th.prayerName');
                const jamahCell = row.querySelector('td.jamah');
                
                if (prayerNameCell && jamahCell) {
                    let prayerName = prayerNameCell.textContent.trim().toLowerCase();
                    const jamahTime = jamahCell.textContent.trim();
                    
                    // Nettoyer le temps (enlever les "am" et "pm")
                    const cleanTime = jamahTime.replace(/\s*(?:am|pm)\s*/i, '').trim();
                    
                    // Faire correspondre les noms de prière
                    if (prayerName === 'zuhr') prayerName = 'dhuhr';
                    if (prayerName.includes('sunrise')) return; // Ignorer sunrise
                    
                    prayerTimes[prayerName] = cleanTime;
                }
            });
            
            return prayerTimes;
        });

        console.log('Données brutes extraites:', rawTimes);

        console.log('Normalisation des données...');

        // Normalisation des temps
        const normalizedTimes = {};
for (let [prayer, time] of Object.entries(rawTimes)) {
    prayer = prayerUtils.standardizePrayerName(prayer);
    if (prayer) {
        const normalizedTime = normalizeTime(time, prayer); // Ajout du paramètre prayer
        if (normalizedTime) {
            normalizedTimes[prayer] = normalizedTime;
        }
    }
}

        const result = {
            source: 'Sparkbrook Masjid Birmingham',
            date: dateUtils.getUKDate(),
            times: normalizedTimes
        };

        const standardizedResult = prayerUtils.normalizeResult(result);
        console.log('Données normalisées:', standardizedResult);
        return standardizedResult;

    } catch (error) {
        console.error('Erreur lors du scraping de Sparkbrook Masjid:', error);
        if (page) {
            await page.screenshot({ path: 'failed_sparkbrook_masjid.png' });
        }
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé');
        }
    }
};

module.exports = scrapeSparkbrookMasjid;