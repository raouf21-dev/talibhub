// Version initiale au format X.XX
export const APP_VERSION = "0.01";

// Service pour vérifier la version actuelle de l'application
export async function checkAppVersion() {
  try {
    // Appel à un endpoint qui renvoie la version actuelle du serveur
    const response = await fetch("/api/version");
    const { version } = await response.json();

    const storedVersion = localStorage.getItem("app_version");

    if (storedVersion !== version) {
      console.log(`Nouvelle version détectée: ${version}`);
      return {
        needsUpdate: true,
        version,
      };
    }

    return { needsUpdate: false };
  } catch (error) {
    console.error("Erreur lors de la vérification de la version:", error);
    return { needsUpdate: false, error };
  }
}
