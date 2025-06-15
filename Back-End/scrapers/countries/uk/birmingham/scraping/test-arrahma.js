const scraper = require("./arRahmaCentreBham.js");

console.log("Test du scraper Ar-Rahma Centre Birmingham (ID: 5)...");

(async () => {
  try {
    console.log("Exécution du scraper...");
    const result = await scraper();
    console.log("Résultat du scraper:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Erreur lors de l'exécution du scraper:", error);
    console.error("Stack trace:", error.stack);
  }
})();
