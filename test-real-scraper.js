const scraper = require("./centralMosqueBham.js");

console.log("Test du scraper Central Mosque Birmingham...");

(async () => {
  try {
    console.log("Exécution du scraper...");
    const result = await scraper();
    console.log("Résultat du scraper:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Erreur lors de l'exécution du scraper:", error);
  }
})();
