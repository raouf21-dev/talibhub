// scrapeQubaIsmalicCenter.js
const scrapeMasjidAlFarouq = require('./scrapers/walsall/masjidAlfarouqWalsall');

async function test() {
    try {
        const result = await scrapeMasjidAlFarouq();
        console.log('Résultat:', result);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

test();