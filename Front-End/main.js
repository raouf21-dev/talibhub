import { initializeAuth } from "./auth.js";
import { initializeNavigation } from "./navigation.js";
import { initializeUtils, navigateTo, updateNavVisibility } from "./utils.js";
import { initializeTopNav } from "./topnav.js";
import { langConfig } from "./Config/apiConfig.js";

/**
 * Vérifie l'authentification de l'utilisateur en consultant le token stocké.
 * Si le token est présent, il effectue une vérification serveur.
 * @returns {Promise<string|null>} Le token si l'utilisateur est authentifié, sinon null.
 */
async function checkAuthStatus() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const response = await fetch("/api/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      localStorage.removeItem("token");
      return null;
    }
    return token;
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    localStorage.removeItem("token");
    return null;
  }
}

/**
 * Fonction principale d'initialisation de l'application.
 */
async function initializeApp() {
  console.log("Initialisation de l'application");

  // Déterminer la langue et la définir dans le document (le choix de la langue se fait dans transLanguages.js)
  const userLang = localStorage.getItem("userLang") || navigator.language.split('-')[0];
  document.documentElement.lang = userLang;

  // Initialisations communes
  initializeUtils();
  initializeNavigation();
  initializeTopNav();

  // Récupérer la page actuelle depuis l'URL
  let currentPath = window.location.pathname.substring(1);
  // Si l'URL correspond à un fichier (ex: index-en.html ou index-fr.html), on redirige vers la page par défaut
  if (currentPath.endsWith(".html") || !currentPath) {
    currentPath = "welcomepage";
  }
  updateNavVisibility(currentPath);

  const token = await checkAuthStatus();

  if (token) {
    console.log("Utilisateur authentifié");
    await navigateTo(currentPath);
  } else {
    console.log("Utilisateur non authentifié");
    await navigateTo("welcomepage");
    await initializeAuth();
  }

  // Gestionnaire de déconnexion
  window.addEventListener("logout", () => {
    localStorage.removeItem("token");
    navigateTo("welcomepage");
  });
}

/**
 * Gère la navigation via les boutons "retour/avant" du navigateur.
 */
window.addEventListener("popstate", async (event) => {
  let targetPage =
    (event.state && event.state.pageId)
      ? event.state.pageId
      : window.location.pathname.substring(1);
  if (targetPage.endsWith(".html") || !targetPage) {
    targetPage = "welcomepage";
  }
  const isUserAuthenticated = await checkAuthStatus();
  if (!isUserAuthenticated && targetPage !== "welcomepage") {
    targetPage = "welcomepage";
  } else if (isUserAuthenticated && targetPage === "welcomepage") {
    targetPage = "dashboard";
  }
  await navigateTo(targetPage, false);
});

// Point d'entrée
document.addEventListener("DOMContentLoaded", initializeApp);

// Gestion globale des erreurs
window.addEventListener("error", (event) => {
  console.error("Erreur globale:", event.error);
});

export { initializeApp };
