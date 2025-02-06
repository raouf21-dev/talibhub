// scrapeQubaIsmalicCenter.js
const scrapeMasjidEHamza = require('./scrapers/birmingham/masjidEHamzaBham');

async function test() {
    try {
        const result = await scrapeMasjidEHamza();
        console.log('Résultat:', result);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

test();