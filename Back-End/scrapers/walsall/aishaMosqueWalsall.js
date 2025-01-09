// Back-End/scrapers/walsall/aishaMosqueWalsall.js
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

const scrapeAishaMosque = async () => {
    let browser;
    let page;
    let frame;

    try {
        console.log('Démarrage du scraping Aisha Mosque...');

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

        await page.goto('https://www.aishamosque.org/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Simulation de comportement humain sur la page principale
        await Promise.all([
            humanBehavior.randomDelay(100, 200),
            humanBehavior.simulateScroll(page)
        ]);

        console.log('Accès à l\'iframe...');

        // Gestion de l'iframe
        await page.waitForSelector('iframe', { timeout: 30000 });
        const frameHandle = await page.$('iframe');
        frame = await frameHandle.contentFrame();

        if (!frame) {
            throw new Error("Impossible d'accéder au contenu de l'iframe (restrictions cross-origin possibles).");
        }

        // Attente des sélecteurs dans l'iframe
        await frame.waitForSelector('.mbx-widget-timetable-nav-date', { timeout: 15000 });
        await frame.waitForSelector('.styles__Item-sc-1h272ay-1', { timeout: 15000 });

        console.log('Extraction des horaires...');

        const times = await frame.evaluate(() => {
            const prayerTimes = {};
            const prayerItems = document.querySelectorAll('.styles__Item-sc-1h272ay-1');

            prayerItems.forEach((item) => {
                const titleElement = item.querySelector('.title');
                const timeElement = item.querySelector('.time.mono');

                if (titleElement && timeElement) {
                    let prayerName = titleElement.textContent.trim().toLowerCase();
                    let timeText = timeElement.textContent.trim();

                    const allowedPrayers = ['fajr', 'zuhr', 'dhuhr', 'asr', 'maghrib', 'isha'];

                    if (allowedPrayers.includes(prayerName)) {
                        const regex = /^(\d{1,2})(\d{2})(AM|PM)?$/i;
                        const match = timeText.match(regex);

                        if (match) {
                            let hours = parseInt(match[1], 10);
                            const minutes = match[2];
                            const period = match[3] ? match[3].toUpperCase() : '';

                            if (period === 'PM' && hours < 12) hours += 12;
                            if (period === 'AM' && hours === 12) hours = 0;

                            prayerTimes[prayerName] = `${hours}:${minutes}`;
                        } else {
                            timeText = timeText.replace(/[^0-9]/g, '');
                            if (timeText.length === 3 || timeText.length === 4) {
                                const hours = parseInt(timeText.slice(0, timeText.length - 2), 10);
                                const minutes = timeText.slice(-2);
                                prayerTimes[prayerName] = `${hours}:${minutes}`;
                            }
                        }
                    }
                }
            });

            return prayerTimes;
        });

        console.log('Données brutes extraites:', times);

        console.log('Normalisation des données...');

        // Normalisation des temps
        const normalizedTimes = {};
        for (let [prayer, time] of Object.entries(times)) {
            prayer = prayerUtils.standardizePrayerName(prayer);
            const normalizedTime = normalizeTime(time);
            if (normalizedTime) {
                normalizedTimes[prayer] = normalizedTime;
            }
        }

        const result = {
            source: 'Aisha Mosque Walsall',
            date: dateUtils.getUKDate(),
            times: normalizedTimes
        };

        const standardizedResult = prayerUtils.normalizeResult(result);
        
        console.log('Données normalisées:', standardizedResult);
        return standardizedResult;

    } catch (error) {
        console.error('Erreur lors du scraping de Aisha Mosque:', error);
        if (page) {
            await page.screenshot({ path: 'failed_aisha_mosque.png' });
        }
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé');
        }
    }
};

module.exports = scrapeAishaMosque;