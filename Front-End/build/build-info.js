// Ce fichier est généré automatiquement par le processus de build
export const BUILD_HASH = "${HASH}"; // Hash généré automatiquement
export const BUILD_DATE = "${BUILD_DATE}";

// Vérification de hash de build
const storedHash = localStorage.getItem("build_hash");
if (storedHash !== BUILD_HASH) {
  console.log(`Nouveau build détecté: ${BUILD_HASH}`);

  // Récupération du service mosqueTimesStorageService
  try {
    // Note: Nous utilisons uniquement localStorage pour le nettoyage des données
    // Les cookies ne sont plus utilisés pour stocker les données de mosquée
    import("../../services/cache/mosqueTimesStorageService.js").then(
      (module) => {
        const mosqueTimesStorageService = module.default;
        mosqueTimesStorageService.clearAllData();
        localStorage.setItem("build_hash", BUILD_HASH);

        // Forcer le rechargement de la page pour prendre en compte tous les changements
        window.location.reload(true);
      }
    );
  } catch (error) {
    console.error("Erreur lors du nettoyage des données:", error);
    localStorage.setItem("build_hash", BUILD_HASH);
    window.location.reload(true);
  }
}
