// main.js

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
 * Seule la page (module) correspondant à l'URL courante est chargée (lazy-loading).
 */
async function initializeApp() {
  console.log("Initialisation de l'application");

  // Déterminer la langue de l'utilisateur et la définir dans le document
  const userLang = navigator.language.split('-')[0];
  const lang = langConfig.SUPPORTED_LANGS.includes(userLang) ? userLang : langConfig.DEFAULT_LANG;
  document.documentElement.lang = lang;

  // Initialisations communes
  initializeUtils();
  initializeNavigation();
  initializeTopNav();

  // Récupérer la page actuelle depuis l'URL ou utiliser 'welcomepage' par défaut
  const currentPath = window.location.pathname.substring(1) || "welcomepage";
  updateNavVisibility(currentPath);

  const token = await checkAuthStatus();

  if (token) {
    console.log("Utilisateur authentifié");
    // Lazy-loading : charge uniquement le module correspondant à l'URL actuelle
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
    // Vous pouvez ajouter ici d'autres opérations de nettoyage si nécessaire
  });
}

/**
 * Gère la navigation via les boutons "retour/avant" du navigateur.
 */
window.addEventListener("popstate", async (event) => {
  let targetPage =
    event.state && event.state.pageId
      ? event.state.pageId
      : window.location.pathname.substring(1) || "welcomepage";
  const isUserAuthenticated = await checkAuthStatus();
  if (!isUserAuthenticated && targetPage !== "welcomepage") {
    targetPage = "welcomepage";
  } else if (isUserAuthenticated && targetPage === "welcomepage") {
    targetPage = "dashboard";
  }
  await navigateTo(targetPage, false);
});

// Point d'entrée : l'application s'initialise lorsque le DOM est entièrement chargé.
document.addEventListener("DOMContentLoaded", initializeApp);

// Gestion globale des erreurs
window.addEventListener("error", (event) => {
  console.error("Erreur globale:", event.error);
});

export { initializeApp };
