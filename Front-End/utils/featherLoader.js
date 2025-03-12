// Gestionnaire simplifié pour Feather Icons
export function initFeather() {
  if (window.feather) {
    try {
      window.feather.replace();
    } catch (error) {
      console.warn("Erreur lors de l'initialisation des icônes:", error);
    }
  }
}

// Initialiser au chargement de la page
document.addEventListener("DOMContentLoaded", initFeather);
window.addEventListener("load", initFeather);

// Exporter feather pour utilisation ailleurs
export default window.feather;
