// scrapeQubaIsmalicCenter.js
const scrapeMasjidSulayman = require("./birmingham/masjidSulaymanBham");

async function test() {
  try {
    const result = await scrapeMasjidSulayman();
    console.log("Résultat:", result);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

test();
 