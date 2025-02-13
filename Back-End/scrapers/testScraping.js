// scrapeQubaIsmalicCenter.js
const scrapeJameMasjid = require("./birmingham/jameMasjidBham");

async function test() {
  try {
    const result = await scrapeJameMasjid();
    console.log("Résultat:", result);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

test();
 