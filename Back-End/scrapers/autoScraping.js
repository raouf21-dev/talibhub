// autoScraping.js
const cron = require("node-cron");
const MosqueTimesController = require("../controllers/mosqueTimesController");
const mosqueTimesModel = require("../models/mosqueTimesModel");

// Fonction pour vérifier si les horaires de prière pour la date actuelle existent déjà
async function checkIfPrayerTimesExist() {
  // Obtenir la date actuelle au format YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  try {
    // Utiliser le modèle existant pour vérifier si des données existent
    const dataExists = await mosqueTimesModel.checkDataExists(today);
    return dataExists;
  } catch (error) {
    console.error(
      "Erreur lors de la vérification des horaires de prière:",
      error
    );
    return false; // En cas d'erreur, on suppose que les horaires n'existent pas
  }
}

// Fonction pour générer un moment aléatoire entre minuit et 1h du matin
function scheduleRandomScraping() {
  // Générer des minutes aléatoires (0-59)
  const randomMinutes = Math.floor(Math.random() * 60);
  // Générer des secondes aléatoires (0-59)
  const randomSeconds = Math.floor(Math.random() * 60);

  // Format de l'expression cron: secondes minutes heures jour mois jour_semaine
  const cronExpression = `${randomSeconds} ${randomMinutes} 0 * * *`;

  console.log(
    `Planification du scraping pour minuit ${randomMinutes} min ${randomSeconds} sec`
  );

  // Schedule the scraping task
  const task = cron.schedule(cronExpression, async () => {
    console.log(
      `🔄 CRON TRIGGERED: Démarrage de la vérification à ${new Date().toLocaleTimeString()}`
    );

    try {
      // Vérifier si les horaires existent déjà
      const timesExist = await checkIfPrayerTimesExist();

      if (timesExist) {
        console.log(
          `ℹ️ Les horaires de prière pour aujourd'hui existent déjà dans la base de données. Scraping ignoré.`
        );
      } else {
        console.log(
          `🔍 Aucun horaire trouvé pour aujourd'hui. Démarrage du scraping...`
        );

        // Exécuter le scraping de toutes les villes
        await MosqueTimesController.scrapeAllCities();

        console.log(
          `✅ Scraping automatique terminé avec succès à ${new Date().toLocaleTimeString()}`
        );
      }

      // Reprogrammer pour le lendemain avec un nouvel horaire aléatoire
      task.stop();
      scheduleRandomScraping();
    } catch (error) {
      console.error(
        `❌ Erreur lors du scraping automatique à ${new Date().toLocaleTimeString()}:`,
        error
      );

      // Même en cas d'erreur, on reprogramme pour le lendemain
      task.stop();
      scheduleRandomScraping();
    }
  });

  return task;
}

// Start the scheduling when the server launches
console.log("🚀 Initialisation du module autoScraping.js");

// Pour le test immédiat (à commenter en production)
// Commenter cette ligne pour désactiver le test immédiat
/*
console.log("⚠️ MODE TEST: Exécution du scraping dans 10 secondes");
setTimeout(async () => {
  console.log("🧪 TEST: Vérification des horaires et scraping si nécessaire...");
  const timesExist = await checkIfPrayerTimesExist();
  if (!timesExist) {
    await MosqueTimesController.scrapeAllCities();
  }
}, 10000);
*/

// Planifier le scraping aléatoire pour la nuit suivante
scheduleRandomScraping();

module.exports = {
  startRandomScraping: scheduleRandomScraping,
};
