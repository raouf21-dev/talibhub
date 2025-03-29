// Ce fichier est généré automatiquement par le processus de build
export const BUILD_HASH = "${HASH}"; // Hash généré automatiquement
export const BUILD_DATE = "${BUILD_DATE}";

// Exporter la fonction de vérification au lieu de l'exécuter immédiatement
export function checkBuildHash(clearDataCallback) {
  const storedHash = localStorage.getItem("build_hash");
  if (storedHash !== BUILD_HASH) {
    console.log(`Nouveau build détecté: ${BUILD_HASH}`);

    // Nettoyer les données
    if (typeof clearDataCallback === "function") {
      clearDataCallback();
    }

    // Mettre à jour le hash stocké
    localStorage.setItem("build_hash", BUILD_HASH);

    // Forcer le rechargement de la page
    window.location.reload(true);
    return true;
  }
  return false;
}
