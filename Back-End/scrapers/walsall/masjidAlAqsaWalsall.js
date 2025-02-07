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

const scrapeMasjidAlAqsaWalsall = async () => {
    let browser;
    let page;
    let frame;

    try {
        console.log('Démarrage du scraping Masjid Al-Aqsa...');

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

        // Désactiver le blocage des ressources pour l'iframe
        await page.setRequestInterception(false);

        console.log('Navigation en cours...');

        await page.goto('https://masjid-alaqsa-walsall.co.uk/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Simulation de comportement humain sur la page principale
        await Promise.all([
            humanBehavior.randomDelay(100, 200),
            humanBehavior.simulateScroll(page)
        ]);

        console.log('Accès à l\'iframe...');

        // Attendre et accéder à l'iframe
        await page.waitForSelector('iframe#go2frame', { timeout: 30000 });
        const frameHandle = await page.$('iframe#go2frame');
        frame = await frameHandle.contentFrame();

        if (!frame) {
            throw new Error("Impossible d'accéder au contenu de l'iframe (restrictions cross-origin possibles).");
        }

        // Attendre que le tableau soit chargé dans l'iframe
        await frame.waitForSelector('table#table2', { timeout: 30000 });
        
        console.log('Extraction des horaires en cours...');

        const rawTimes = await frame.evaluate(() => {
            const prayerTimes = {};
            const idMapping = {
                'fajarJamat': 'fajr',
                'zuhrJamat': 'dhuhr',
                'asarJamat': 'asr',
                'maghribJamat': 'maghrib',
                'eshaJamat': 'esha'
            };

            for (const [elementId, prayerName] of Object.entries(idMapping)) {
                const element = document.getElementById(elementId);
                if (element) {
                    let time = element.textContent.trim();
                    // Nettoyage du texte pour enlever "am" ou "pm" si présent
                    time = time.toLowerCase().replace('am', '').replace('pm', '').trim();
                    if (time) {
                        prayerTimes[prayerName] = time;
                    }
                }
            }

            return prayerTimes;
        });

        if (!rawTimes || Object.keys(rawTimes).length === 0) {
            throw new Error('Aucun horaire de prière trouvé');
        }

        console.log('Données brutes extraites:', rawTimes);

        console.log('Normalisation des données...');

        const normalizedTimes = {};
        for (let [prayer, time] of Object.entries(rawTimes)) {
            prayer = prayerUtils.standardizePrayerName(prayer);
            if (prayer) {
                const normalizedTime = normalizeTime(time, prayer);
                if (normalizedTime) {
                    normalizedTimes[prayer] = normalizedTime;
                }
            }
        }

        const result = {
            source: 'Masjid Al-Aqsa Walsall',
            date: dateUtils.getUKDate(),
            times: normalizedTimes
        };

        const standardizedResult = prayerUtils.normalizeResult(result);
        console.log('Données extraites avec succès:', standardizedResult);
        return standardizedResult;

    } catch (error) {
        console.error('Erreur lors du scraping de Masjid Al-Aqsa:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé');
        }
    }
};

module.exports = scrapeMasjidAlAqsaWalsall;