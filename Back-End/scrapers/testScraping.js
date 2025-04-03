// scrapeQubaIsmalicCenter.js
const scrapeEsaIbnMaryama = require("./birmingham/masjidEsaIbnMaryamaBham");

async function test() {
  try {
    const result = await scrapeEsaIbnMaryama();
    console.log("Résultat:", result);
  } catch (error) {
    console.error("Erreur:", error);
  }
}

test();
 