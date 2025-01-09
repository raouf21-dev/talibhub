// Back-End/scrapers/birmingham/muslimStudentsHouseBham.js
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

const handleCloudflare = async (page) => {
    try {
        const hasChallenge = await page.evaluate(() => {
            return document.querySelector('#challenge-running') !== null ||
                   document.querySelector('#cf-spinner') !== null ||
                   document.querySelector('.cf-browser-verification') !== null;
        });

        if (hasChallenge) {
            console.log('Protection Cloudflare détectée, tentative de contournement...');
            await page.waitForFunction(
                () => {
                    return !document.querySelector('#challenge-running') &&
                           !document.querySelector('#cf-spinner') &&
                           !document.querySelector('.cf-browser-verification');
                },
                { timeout: 15000 }
            );
            await humanBehavior.randomDelay(1000, 1500);
        }
        return true;
    } catch (error) {
        throw new Error('Impossible de passer la protection Cloudflare');
    }
};

const scrapeMSHUK = async () => {
    let browser;
    let page;

    try {
        console.log('Démarrage du scraping MSHUK...');

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

        console.log('Navigation vers MSHUK...');

        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount < maxRetries) {
            try {
                await page.goto('https://www.mshuk.org/', {
                    waitUntil: 'domcontentloaded',
                    timeout: 25000
                });

                await handleCloudflare(page);

                await Promise.all([
                    humanBehavior.randomDelay(100, 200),
                    humanBehavior.simulateScroll(page)
                ]);

                await page.waitForSelector('.section-prayer-horizontal-times', {
                    timeout: 15000,
                    visible: true
                });

                console.log('Page chargée avec succès');
                break;
            } catch (error) {
                retryCount++;
                if (retryCount === maxRetries) {
                    await page.screenshot({ path: 'failed_mshuk.png' });
                    throw error;
                }
                console.log(`Tentative ${retryCount}/${maxRetries}`);
                await humanBehavior.randomDelay(2000, 3000);
            }
        }

        await humanBehavior.moveMouseRandomly(page, '.section-prayer-horizontal-times');

        console.log('Extraction des horaires en cours...');

        const rawData = await page.evaluate(() => {
            const prayers = {};
            const prayerItems = document.querySelectorAll('.section-prayer-horizontal-times-item');
            const validPrayers = new Set(['fajr', 'zuhr', 'dhuhr', 'asr', 'maghrib', 'isha']);
            
            prayerItems.forEach(item => {
                const nameElement = item.querySelector('span');
                const jamaatElement = item.querySelector('div:last-child');
                
                if (nameElement && jamaatElement) {
                    const name = nameElement.textContent.trim().toLowerCase();
                    const time = jamaatElement.textContent.trim();
                    
                    if (validPrayers.has(name) && time) {
                        prayers[name] = time;
                    }
                }
            });
            
            return prayers;
        });

        if (!rawData || Object.keys(rawData).length === 0) {
            throw new Error('Aucun horaire de prière trouvé');
        }

        console.log('Données brutes extraites:', rawData);

        console.log('Normalisation des données...');

        // Standardisation des noms de prière et normalisation initiale des temps
        const normalizedTimes = {};
        for (let [prayer, time] of Object.entries(rawData)) {
            prayer = prayerUtils.standardizePrayerName(prayer);
            const normalizedTime = normalizeTime(time);
            if (normalizedTime) {
                normalizedTimes[prayer] = normalizedTime;
            }
        }

        // Création du résultat intermédiaire
        const result = {
            source: 'MSHUK',
            date: dateUtils.getUKDate(),
            times: normalizedTimes
        };

        // Normalisation finale avec validation
        const finalResult = prayerUtils.normalizeResult(result);
        
        console.log('Données normalisées:', finalResult);
        return finalResult;

    } catch (error) {
        console.error('Erreur lors du scraping de MSHUK:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé');
        }
    }
};

module.exports = scrapeMSHUK;