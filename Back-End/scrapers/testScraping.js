// scrapeQubaIsmalicCenter.js
const scrapeMahmudSabirMasjid = require("./birmingham/mahmudSabirMasjidBham");

async function test() {
  try {
    const result = await scrapeMahmudSabirMasjid();
    console.log("Résultat:", result);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

test();
 