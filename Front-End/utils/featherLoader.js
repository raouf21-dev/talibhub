// Simple gestionnaire Feather
export function initFeather() {
  if (window.feather) {
    try {
      window.feather.replace();
    } catch (error) {
      console.warn("Erreur Feather:", error);
    }
  }
}

// Initialiser au chargement
document.addEventListener("DOMContentLoaded", initFeather);
window.addEventListener("load", initFeather);

// Exporter feather pour utilisation ailleurs
export default window.feather;
