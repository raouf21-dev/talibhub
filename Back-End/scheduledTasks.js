// Importer tous les scripts de tâches planifiées
require("./scrapers/autoScraping");
// ... autres tâches planifiées ...

console.log("Toutes les tâches planifiées ont été initialisées");

// Gestion améliorée des tâches planifiées
const { startRandomScraping } = require("./scrapers/autoScraping");

// Stocker les références aux tâches pour pouvoir les arrêter si nécessaire
const activeTasks = {};

// Fonction pour démarrer toutes les tâches
function startAllTasks() {
  console.log("Démarrage de toutes les tâches planifiées...");
  activeTasks.scraping = startRandomScraping();
  // Ajouter d'autres tâches ici...
}

// Fonction pour arrêter toutes les tâches
function stopAllTasks() {
  Object.values(activeTasks).forEach((task) => {
    if (task && typeof task.stop === "function") {
      task.stop();
    }
  });
}

// Démarrer automatiquement
startAllTasks();

module.exports = {
  startAllTasks,
  stopAllTasks,
};
