// scheduledTasks.js
console.log("Initialisation des tâches planifiées...");

// Ne pas importer ici puisqu'on l'importe déjà plus bas
// require("./scrapers/autoScraping");

// Gestion améliorée des tâches planifiées
const { startRandomScraping } = require("./scrapers/auto-scraping");

// Stocker les références aux tâches pour pouvoir les arrêter si nécessaire
const activeTasks = {};

// Fonction pour démarrer toutes les tâches
function startAllTasks() {
  console.log("Démarrage de toutes les tâches planifiées...");
  activeTasks.scraping = startRandomScraping();
  console.log("Tâche de scraping initialisée");
  // Ajouter d'autres tâches ici...
}

// Fonction pour arrêter toutes les tâches
function stopAllTasks() {
  console.log("Arrêt de toutes les tâches planifiées...");
  Object.values(activeTasks).forEach((task) => {
    if (task && typeof task.stop === "function") {
      task.stop();
    }
  });
}

// Démarrer automatiquement
startAllTasks();

console.log("Toutes les tâches planifiées ont été initialisées");

module.exports = {
  startAllTasks,
  stopAllTasks,
};
