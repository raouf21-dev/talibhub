// Imports principaux pour main.js
import { langConfig } from "./config/apiConfig.js";
import { authService } from "./services/auth/authService.js";
import AppState from "./services/state/state.js";
import CacheService from "./services/cache/cacheService.js";
import mosqueTimesStorageService from "./services/cache/mosqueTimesStorageService.js";
import { APP_VERSION } from "./utils/version.js";
import { BUILD_HASH, checkBuildHash } from "./build/build-info.js";

// Importation du système de traductions
import translationManager from "./utils/translations.js";

// Note: Les imports de utils.js sont supprimés pour éviter les dépendances circulaires
// Ces fonctions seront importées dynamiquement quand nécessaire

// Fonction pour détecter et corriger les boucles de redirection
(function detectRedirectLoop() {
  const currentPath = window.location.pathname;
  const referrer = document.referrer;

  // Stocker l'état de navigation pour le débogage
  const state = {
    currentPath,
    referrer,
    hasToken: !!localStorage.getItem("token"),
    stopRedirects: !!sessionStorage.getItem("stopRedirects"),
    navigationStack: new Error().stack,
  };

  // Créer une variable de session qui empêche de rentrer dans une boucle
  // Mais permet encore d'exécuter le code de vérification de version
  if (sessionStorage.getItem("stopRedirects")) {
    console.log(
      "Redirection bloquée précédemment - mais continuons l'exécution"
    );
    // Supprimer la référence pour une future tentative
    sessionStorage.removeItem("stopRedirects");
    // Ne pas quitter la fonction, continuons l'exécution
  }
})();

// Intercepter les redirections
(function interceptRedirects() {
  // Sauvegarder la fonction originale
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  // Remplacer pushState
  history.pushState = function () {
    if (window.stopRedirects) {
      console.warn("Redirection bloquée:", arguments[2]);
      return;
    }
    return originalPushState.apply(this, arguments);
  };

  // Remplacer replaceState
  history.replaceState = function () {
    if (window.stopRedirects) {
      console.warn("Redirection bloquée:", arguments[2]);
      return;
    }
    return originalReplaceState.apply(this, arguments);
  };

  // Intercepter les redirections via window.location
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(
    window,
    "location"
  );
  if (originalLocationDescriptor && originalLocationDescriptor.configurable) {
    Object.defineProperty(window, "location", {
      get: function () {
        return originalLocationDescriptor.get.call(this);
      },
      set: function (value) {
        if (window.stopRedirects) {
          console.warn("Redirection bloquée:", value);
          return;
        }
        originalLocationDescriptor.set.call(this, value);
      },
      configurable: true,
    });
  }
})();

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
  // Vérification de build-info.js...
  console.log("Vérification de build-info.js...");
  const buildUpdated = checkBuildHash(() => {
    console.log(
      "Nettoyage des données suite à la détection d'un nouveau build"
    );
    mosqueTimesStorageService.clearAllData();
  });

  // Si un nouveau build est détecté, la page sera rechargée et nous n'exécuterons pas le reste
  if (buildUpdated) {
    console.log("Build mis à jour - recharge en cours...");
    return;
  }

  // Vérification de version APP_VERSION
  const storedVersion = localStorage.getItem("app_version");
  console.log("Version actuelle:", APP_VERSION);
  console.log("Version stockée:", storedVersion);
  if (storedVersion !== APP_VERSION) {
    console.log(`Nouvelle version détectée: ${APP_VERSION}`);
    mosqueTimesStorageService.clearAllData();
    localStorage.setItem("app_version", APP_VERSION);
    // Notification reportée après l'initialisation de l'interface
    window.showUpdateNotification = true;
  }

  // Détermine la langue et la définit dans le document.
  const userLang =
    localStorage.getItem("userLang") || navigator.language.split("-")[0];
  document.documentElement.lang = userLang;

  // Récupère la page actuelle depuis l'URL
  let currentPath = window.location.pathname.substring(1);
  if (currentPath.endsWith(".html") || !currentPath) {
    currentPath = "welcomepage";
  }

  // Importer dynamiquement les utilitaires pour éviter les dépendances circulaires
  const { updateNavVisibility, initializeUtils } = await import(
    "./utils/utils.js"
  );
  const { initializeNavigation } = await import(
    "./components/navigation/navigation.js"
  );
  const { initializeTopNav } = await import(
    "./components/navigation/topnav.js"
  );

  // Appliquer immédiatement la visibilité de la navigation
  updateNavVisibility(currentPath);

  // Initialisations communes
  initializeUtils();
  initializeNavigation();

  // Initialiser topnav seulement si nécessaire
  const isWelcomePage = currentPath === "welcomepage";
  const hasToken = localStorage.getItem("token");
  if (!isWelcomePage || hasToken) {
    initializeTopNav();
  } else {
    console.log("Initialisation de topnav ignorée sur welcomepage");
  }

  // Importer dynamiquement les fonctions nécessaires
  const { navigateTo } = await import("./utils/utils.js");
  const { initializeAuth } = await import("./components/auth/auth.js");

  const token = await checkAuthStatus();

  if (token) {
    console.log("Utilisateur authentifié");
    await navigateTo(currentPath);
  } else {
    console.log("Utilisateur non authentifié");
    await navigateTo("welcomepage");
    await initializeAuth();
  }

  // Gestion des événements de navigation
  document.querySelectorAll("[data-destination]").forEach((element) => {
    element.addEventListener("click", (e) => {
      const destination = e.currentTarget.dataset.destination;
      if (destination) {
        navigateTo(destination);
      }
    });
  });

  // Gestion de la déconnexion
  document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await authService.logout();
    window.location.reload();
  });
}

// Gestion globale de l'événement "login" :
// Lorsqu'un login réussi est déclenché, on initialise la topnav
window.addEventListener("login", async () => {
  console.log("Événement login détecté, initialisation de la topnav");
  const { initializeTopNav } = await import(
    "./components/navigation/topnav.js"
  );
  await initializeTopNav();
});

// Gestion globale de l'événement "logout" :
// Lorsqu'un logout est déclenché (par exemple via une réponse 401),
// on supprime le token et redirige l'utilisateur vers la page de connexion.
window.addEventListener("logout", async () => {
  localStorage.removeItem("token");

  // Vérifier si nous sommes déjà sur welcomepage pour éviter une boucle
  if (window.location.pathname !== "/welcomepage") {
    console.log("Redirection vers welcomepage suite à une déconnexion");
    const { navigateTo } = await import("./utils/utils.js");
    navigateTo("welcomepage");
  }
});

/**
 * Gère la navigation via les boutons "retour/avant" du navigateur.
 */
window.addEventListener("popstate", async (event) => {
  let targetPage =
    event.state && event.state.pageId
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
  const { navigateTo } = await import("./utils/utils.js");
  await navigateTo(targetPage, false);
});

// Point d'entrée
document.addEventListener("DOMContentLoaded", initializeApp);

// Gestion globale des erreurs
window.addEventListener("error", (event) => {
  console.error("Erreur globale:", event.error);
});

// Exportation pour utilisation dans d'autres fichiers si nécessaire
export { authService, CacheService };
