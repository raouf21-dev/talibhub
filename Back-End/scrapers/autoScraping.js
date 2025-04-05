// autoScraping.js
const cron = require("node-cron");
const mosqueTimesController = require("../controllers/mosqueTimesController");
const mosqueTimesModel = require("../models/mosqueTimesModel");

// Logs améliorés
function logInfo(message) {
  console.log(`[AUTOSCRAPING] ${new Date().toISOString()} - INFO: ${message}`);
}

function logError(message, error) {
  console.error(
    `[AUTOSCRAPING] ${new Date().toISOString()} - ERROR: ${message}`,
    error
  );
}

// Fonction pour vérifier si les horaires de prière pour la date actuelle existent déjà
async function checkIfPrayerTimesExist() {
  // Obtenir la date actuelle au format YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  logInfo(`Vérification de l'existence des horaires pour la date: ${today}`);

  try {
    // Utiliser le modèle existant pour vérifier si des données existent
    const dataExists = await mosqueTimesModel.checkDataExists(today);
    logInfo(
      `Résultat de la vérification: ${
        dataExists ? "Les données existent" : "Aucune donnée trouvée"
      }`
    );
    return dataExists;
  } catch (error) {
    logError("Erreur lors de la vérification des horaires de prière:", error);
    return false; // En cas d'erreur, on suppose que les horaires n'existent pas
  }
}

// Fonction pour générer un moment aléatoire entre minuit et 1h du matin
function scheduleRandomScraping() {
  try {
    // Générer des minutes aléatoires (0-59)
    const randomMinutes = Math.floor(Math.random() * 60);
    // Générer des secondes aléatoires (0-59)
    const randomSeconds = Math.floor(Math.random() * 60);

    // Format de l'expression cron: secondes minutes heures jour mois jour_semaine
    const cronExpression = `${randomSeconds} ${randomMinutes} 0 * * *`;

    logInfo(
      `Planification du scraping pour minuit ${randomMinutes}m:${randomSeconds}s (Fuseau horaire serveur: ${
        Intl.DateTimeFormat().resolvedOptions().timeZone
      })`
    );
    logInfo(`Expression cron utilisée: ${cronExpression}`);

    // Schedule the scraping task
    const task = cron.schedule(cronExpression, async () => {
      logInfo(
        `🔄 CRON TRIGGERED: Démarrage de la vérification à ${new Date().toLocaleTimeString()}`
      );

      try {
        // Vérifier si les horaires existent déjà
        const timesExist = await checkIfPrayerTimesExist();

        if (timesExist) {
          logInfo(
            `ℹ️ Les horaires de prière pour aujourd'hui existent déjà dans la base de données. Scraping ignoré.`
          );
        } else {
          logInfo(
            `🔍 Aucun horaire trouvé pour aujourd'hui. Démarrage du scraping...`
          );

          try {
            // Exécuter le scraping de toutes les villes
            logInfo("Contrôleur importé avec succès, lancement du scraping...");

            // Utiliser la méthode scrapeAllCities sans les paramètres req/res
            await mosqueTimesController.scrapeAllCities();

            logInfo(
              `✅ Scraping automatique terminé avec succès à ${new Date().toLocaleTimeString()}`
            );
          } catch (scrapingError) {
            logError("Erreur pendant le scraping:", scrapingError);
          }
        }

        // Reprogrammer pour le lendemain avec un nouvel horaire aléatoire
        logInfo("Arrêt de la tâche actuelle et replanification pour demain");
        task.stop();
        scheduleRandomScraping();
      } catch (error) {
        logError(`❌ Erreur lors du scraping automatique:`, error);

        // Même en cas d'erreur, on reprogramme pour le lendemain
        logInfo(
          "Erreur rencontrée, replanification pour demain malgré l'erreur"
        );
        task.stop();
        scheduleRandomScraping();
      }
    });

    return task;
  } catch (setupError) {
    logError(
      "Erreur lors de la configuration du scraping automatique:",
      setupError
    );
    // En cas d'erreur critique, on réessaie dans 1 heure
    logInfo(
      "Tentative de replanification dans 1 heure suite à une erreur critique"
    );
    setTimeout(scheduleRandomScraping, 60 * 60 * 1000);
    return null;
  }
}

// Ajouter un test immédiat pour vérifier que tout fonctionne
logInfo("🚀 Initialisation du module autoScraping.js");
logInfo(`Heure actuelle du serveur: ${new Date().toISOString()}`);
logInfo(
  `Fuseau horaire du serveur: ${
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Non détecté"
  }`
);

// Test de fonctionnement du module après 5 secondes
setTimeout(async () => {
  logInfo("🧪 TEST: Vérification que le module fonctionne correctement...");
  try {
    const result = await checkIfPrayerTimesExist();
    logInfo(
      `Test de vérification des données terminé avec résultat: ${result}`
    );
  } catch (testError) {
    logError("Erreur lors du test de vérification:", testError);
  }
}, 5000);

// Planifier le scraping aléatoire pour la nuit suivante
const activeTask = scheduleRandomScraping();
if (activeTask) {
  logInfo("✅ Tâche de scraping planifiée avec succès");
}

module.exports = {
  startRandomScraping: scheduleRandomScraping,
};
