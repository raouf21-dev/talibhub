// Fichier à mettre à jour manuellement à chaque déploiement
export const APP_VERSION = "1.2.3"; // Incrémentez ce numéro à chaque déploiement

// Service pour vérifier la version actuelle de l'application
export async function checkAppVersion() {
  try {
    // Appel à un endpoint qui renvoie la version actuelle du serveur
    const response = await fetch("/api/version");
    const { version, buildHash } = await response.json();

    const storedVersion = localStorage.getItem("app_version");
    const storedHash = localStorage.getItem("build_hash");

    if (storedVersion !== version || storedHash !== buildHash) {
      console.log(`Nouvelle version détectée: ${version} (${buildHash})`);
      return {
        needsUpdate: true,
        version,
        buildHash,
      };
    }

    return { needsUpdate: false };
  } catch (error) {
    console.error("Erreur lors de la vérification de la version:", error);
    return { needsUpdate: false, error };
  }
}
