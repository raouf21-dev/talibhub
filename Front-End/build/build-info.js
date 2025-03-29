// Ce fichier est généré manuellement pour le débogage
// Remplacer par un hash unique à chaque déploiement
export const BUILD_HASH =
  "debug" + new Date().getTime().toString().substring(0, 8);
export const BUILD_DATE = new Date().toISOString();

console.log("build-info.js chargé - Hash actuel:", BUILD_HASH);

// Exporter la fonction de vérification au lieu de l'exécuter immédiatement
export function checkBuildHash(clearDataCallback) {
  const storedHash = localStorage.getItem("build_hash");
  console.log("Comparaison des hash:", {
    storedHash,
    currentHash: BUILD_HASH,
    areEqual: storedHash === BUILD_HASH,
  });

  if (storedHash !== BUILD_HASH) {
    console.log(`Nouveau build détecté: ${BUILD_HASH}`);

    // Nettoyer les données
    if (typeof clearDataCallback === "function") {
      console.log("Exécution du callback de nettoyage");
      clearDataCallback();
    }

    // Mettre à jour le hash stocké
    console.log("Mise à jour du hash stocké:", BUILD_HASH);
    localStorage.setItem("build_hash", BUILD_HASH);

    // Forcer le rechargement de la page
    console.log("Demande de rechargement de la page");

    // Ajouter un délai pour s'assurer que les logs sont affichés
    setTimeout(() => {
      window.location.reload(true);
    }, 500);

    return true;
  }
  console.log("Aucune mise à jour détectée");
  return false;
}
