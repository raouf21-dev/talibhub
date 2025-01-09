// scraperUtils.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { executablePath } = require('puppeteer');
const { DateTime } = require('luxon');
const fs = require('fs');

// Configuration de base du stealth plugin
const stealth = StealthPlugin();
stealth.enabledEvasions.delete('webgl.vendor');
stealth.enabledEvasions.delete('webgl.renderer');
puppeteer.use(stealth);

// User Agents
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0'
];

// Configuration du navigateur
const getDefaultBrowserConfig = () => ({
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
    ],
    ignoreHTTPSErrors: true
});

const setupChromiumPath = async () => {
    try {
        if (fs.existsSync('/usr/bin/chromium-browser')) {
            return '/usr/bin/chromium-browser';
        }
        return executablePath();
    } catch (error) {
        return executablePath();
    }
};

const getDefaultHeaders = () => ({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'DNT': '1'
});

class TimeValidator {
    static validateTime(timeStr) {
        if (!timeStr) return null;
        
        // Nettoyer la chaîne
        timeStr = timeStr.trim().toLowerCase();
        if (timeStr === '--:--' || timeStr === 'n/a' || timeStr === '--') return null;

        try {
            // Parser le format AM/PM si présent
            let hours, minutes;
            const isPM = timeStr.includes('pm');
            const isAM = timeStr.includes('am');
            
            // Enlever AM/PM et nettoyer
            timeStr = timeStr.replace(/[ap]m/i, '').trim();
            
            // Gérer différents formats de séparation
            if (timeStr.includes(':')) {
                [hours, minutes] = timeStr.split(':').map(Number);
            } else {
                // Format sans séparateur (e.g., "0730")
                timeStr = timeStr.padStart(4, '0');
                hours = parseInt(timeStr.slice(0, 2));
                minutes = parseInt(timeStr.slice(2));
            }

            // Validation de base
            if (isNaN(hours) || isNaN(minutes)) return null;
            if (minutes >= 60) return null;
            
            // Conversion AM/PM
            if (isPM && hours < 12) hours += 12;
            if (isAM && hours === 12) hours = 0;
            
            // Validation finale
            if (hours >= 24) return null;
            
            // Formatage
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } catch (error) {
            console.error('Erreur de validation du temps:', error);
            return null;
        }
    }

    static validatePrayerTimes(times) {
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const validated = {};
        let hasValidTimes = false;

        for (const prayer of prayers) {
            validated[prayer] = this.validateTime(times[prayer]);
            if (validated[prayer]) hasValidTimes = true;
        }

        return hasValidTimes ? validated : null;
    }
}

const browserUtils = {
    async launch(options = {}) {
        const defaultConfig = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
            ],
            ignoreHTTPSErrors: true,
            defaultViewport: null
        };

        try {
            const execPath = await setupChromiumPath();
            const browser = await puppeteer.launch({
                ...defaultConfig,
                ...options,
                executablePath: execPath
            });

            return browser;
        } catch (error) {
            console.error('Erreur lors du lancement du navigateur:', error);
            throw error;
        }
    },

    async createPage(browser) {
        const page = await browser.newPage();
        await this.setupPage(page);
        return page;
    },

    async setupPage(page) {
        // Définir un user agent aléatoire
        const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        await page.setUserAgent(randomUserAgent);

        // Configuration de base
        await page.setDefaultNavigationTimeout(30000);
        await page.setRequestInterception(true);
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setExtraHTTPHeaders(getDefaultHeaders());

        // Bloquer les ressources inutiles
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                request.abort();
            } else {
                request.continue();
            }
        });

        // Gérer les erreurs de page
        page.on('error', error => {
            console.error('Erreur de page:', error);
        });

        // Anti-détection
        await page.evaluateOnNewDocument(() => {
            delete Object.getPrototypeOf(navigator).webdriver;
            Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
            Object.defineProperty(navigator, 'productSub', { get: () => '20100101' });
            Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
            window.navigator.chrome = { runtime: {} };
        });
    }
};

// Navigation sécurisée
const safeNavigation = async (page, url, options = {}) => {
    const config = {
        retries: 2,
        timeout: 25000,
        waitUntil: 'networkidle0',
        ...options
    };

    for (let i = 0; i < config.retries; i++) {
        try {
            const response = await page.goto(url, {
                waitUntil: config.waitUntil,
                timeout: config.timeout
            });

            // Vérifier et gérer les erreurs de Cloudflare
            if (response.status() === 403 || response.status() === 503) {
                const content = await page.content();
                if (content.includes('challenge-running') || content.includes('cf-browser-verification')) {
                    await page.waitForTimeout(5000);
                    continue;
                }
            }

            return response;
        } catch (error) {
            if (i === config.retries - 1) throw error;
            await page.waitForTimeout(3000);
        }
    }
};

// Utilitaires de temps
const normalizeTime = (timeStr, prayerName = null) => {
    if (!timeStr) return null;

    try {
        // Nettoyer la chaîne
        timeStr = timeStr.trim().toLowerCase();
        if (timeStr === '--:--' || timeStr === 'n/a' || timeStr === '--') return null;

        // Parser le format AM/PM si présent
        let hours, minutes;
        const isPM = timeStr.includes('pm');
        const isAM = timeStr.includes('am');
        
        // Enlever AM/PM et nettoyer
        timeStr = timeStr.replace(/[ap]m/i, '').trim();
        
        // Gérer différents formats de séparation
        if (timeStr.includes(':')) {
            [hours, minutes] = timeStr.split(':').map(Number);
        } else {
            // Format sans séparateur (e.g., "0730")
            timeStr = timeStr.padStart(4, '0');
            hours = parseInt(timeStr.slice(0, 2));
            minutes = parseInt(timeStr.slice(2));
        }

        // Validation de base
        if (isNaN(hours) || isNaN(minutes)) return null;
        if (minutes >= 60) return null;
        
        // Conversion basée sur la prière et l'heure
        if (!isPM && !isAM) {
            if (prayerName === 'fajr') {
                // Fajr est toujours le matin
                if (hours >= 12) hours -= 12;
            }
            else if (prayerName && ['asr', 'maghrib', 'isha'].includes(prayerName)) {
                // Ces prières sont toujours l'après-midi/soir
                if (hours < 12) hours += 12;
            }
            else if (hours <= 6) {
                // Pour les heures très tôt sans indication AM/PM, supposer AM
                // Ne rien faire, garder l'heure telle quelle
            }
            else if (hours >= 7 && hours < 12) {
                // Pour les heures de la journée, vérifier le contexte
                if (prayerName && ['dhuhr', 'asr', 'maghrib', 'isha'].includes(prayerName)) {
                    hours += 12;
                }
            }
        }
        else {
            // Conversion standard AM/PM
            if (isPM && hours < 12) hours += 12;
            if (isAM && hours === 12) hours = 0;
        }

        // Validation finale
        if (hours >= 24) return null;
        
        // Formatage
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch (error) {
        console.error('Erreur de normalisation du temps:', error);
        return null;
    }
};

// Utilitaires de prière
const prayerUtils = {
    standardizePrayerName: (name) => {
        if (!name) return null;
        
        const prayerMappings = {
            'fajr': 'fajr',
            'zuhr': 'dhuhr',
            'dhuhr': 'dhuhr',
            'duhr': 'dhuhr',
            'zohar': 'dhuhr',
            'dhur': 'dhuhr',
            'asr': 'asr',
            'maghrib': 'maghrib',
            'isha': 'isha'
        };

        return prayerMappings[name.toLowerCase().trim()] || null;
    },

    normalizeResult: (result) => {
        if (!result || !result.times) {
            throw new Error('Format de résultat invalide');
        }

        const requiredPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const normalizedTimes = {};

        for (const prayer of requiredPrayers) {
            if (result.times[prayer]) {
                const normalizedTime = normalizeTime(result.times[prayer]);
                if (normalizedTime) {
                    normalizedTimes[prayer] = normalizedTime;
                }
            }
        }

        // Vérifier qu'au moins une prière est valide
        const hasValidTimes = Object.values(normalizedTimes).some(time => time !== null);
        if (!hasValidTimes) {
            throw new Error('Aucune heure de prière valide trouvée');
        }

        return {
            source: result.source,
            date: result.date,
            times: normalizedTimes
        };
    }
};

// Utilitaires pour les erreurs
const errorUtils = {
    saveFailedPage: async (page, filename) => {
        try {
            const content = await page.content();
            fs.writeFileSync(filename, content);
            console.log(`Page sauvegardée dans ${filename}`);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la page:', error);
        }
    },

    logScrapingError: (source, error) => {
        console.error(`Erreur lors du scraping de ${source}:`, {
            source,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    }
};

// Utilitaires de date
const dateUtils = {
    getUKDateTime: () => DateTime.now().setZone('Europe/London'),
    getUKDate: () => DateTime.now().setZone('Europe/London').toISODate()
};

// Exporter toutes les utilités
module.exports = {
    TimeValidator,
    browserUtils,
    getDefaultBrowserConfig,
    getDefaultHeaders,
    setupChromiumPath,
    safeNavigation,
    normalizeTime,
    prayerUtils,
    errorUtils,
    dateUtils,
    userAgents
};