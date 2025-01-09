// Back-End/scrapers/birmingham/arRahmaCentreBham.js
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

const scrapeArRahmaCentreBham = async () => {
    let browser;
    let page;
    
    try {
        console.log('Démarrage du scraping Ar-Rahma Centre...');

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
        
        await page.goto('https://arrahmacentre.com/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Simulation rapide de comportement humain
        await Promise.all([
            humanBehavior.randomDelay(100, 200),
            humanBehavior.simulateScroll(page)
        ]);

        console.log('Recherche du tableau des horaires...');
        await page.waitForSelector('table', { timeout: 20000 });
        
        // Simulation de mouvement de souris vers le tableau
        await humanBehavior.moveMouseRandomly(page, 'table');

        console.log('Extraction des horaires en cours...');

        const times = await page.evaluate(() => {
            const prayerTimes = {};
            const allowedPrayers = ['fajr', 'zuhr', 'dhuhr', 'asr', 'maghrib', 'isha'];
            
            const tables = document.querySelectorAll('table');
            let prayerTable;

            for (const table of tables) {
                if (table.textContent.toLowerCase().includes('fajr')) {
                    prayerTable = table;
                    break;
                }
            }

            if (!prayerTable) return null;

            const rows = prayerTable.querySelectorAll('tr');
            
            rows.forEach(row => {
                const prayerCell = row.querySelector('th');
                const jamaahCell = row.querySelector('td:last-child');
                
                if (prayerCell && jamaahCell) {
                    const prayerName = prayerCell.textContent.trim().toLowerCase();
                    const jamaahTime = jamaahCell.textContent.trim();
                    
                    if (allowedPrayers.includes(prayerName)) {
                        prayerTimes[prayerName] = jamaahTime;
                    }
                }
            });

            return prayerTimes;
        });

        if (!times || Object.keys(times).length === 0) {
            throw new Error('Aucun horaire de prière trouvé');
        }

        console.log('Normalisation des données...');

        const normalizedTimes = {};
        for (let [prayer, time] of Object.entries(times)) {
            prayer = prayerUtils.standardizePrayerName(prayer);
            const normalizedTime = normalizeTime(time);
            if (normalizedTime) {
                normalizedTimes[prayer] = normalizedTime;
            }
        }

        // Créer le résultat avec le format attendu
        const result = {
            source: 'Ar-Rahma Centre',
            date: dateUtils.getUKDate(),
            times: normalizedTimes
        };

        // Valider et standardiser le résultat
        const standardizedResult = prayerUtils.normalizeResult(result);
        
        console.log('Données extraites avec succès:', standardizedResult);
        return standardizedResult;

    } catch (error) {
        console.error('Erreur lors du scraping de Ar-Rahma Centre:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Navigateur fermé');
        }
    }
};

module.exports = scrapeArRahmaCentreBham;