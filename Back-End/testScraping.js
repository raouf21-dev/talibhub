// scrapeQubaIsmalicCenter.js
const scrapeMasjidAlAqsaWalsall = require('./scrapers/walsall/masjidAlAqsaWalsall');

async function test() {
    try {
        const result = await scrapeMasjidAlAqsaWalsall();
        console.log('Résultat:', result);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

test();