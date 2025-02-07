// scrapeQubaIsmalicCenter.js
const scrapeBournvilleMasjid = require('./scrapers/birmingham/bournvilleMasjidBham');

async function test() {
    try {
        const result = await scrapeBournvilleMasjid();
        console.log('Résultat:', result);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

test();