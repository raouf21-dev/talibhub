// Imports corrects pour main.js
import { initializeAuth } from "./components/auth/auth.js";
import { initializeNavigation } from "./components/navigation/navigation.js";
import { initializeWelcomepage } from "./components/welcome/welcomePage.js";
import { initializeNotifications } from "./components/notifications/notifications.js";
import { initializeTimer } from "./components/timer/timer.js";
import { initializeSurahSelector } from "./components/quran/surahSelector.js";
import { initializeMosqueTime } from "./components/prayer/mosqueTime.js";
import { initializeStatistics } from "./components/statistics/statistics.js";
import { initializeUtils, updateNavVisibility } from "./utils/utils.js";
import { initializeTopNav } from "./components/navigation/topnav.js";
import { langConfig } from "./config/apiConfig.js";

// Importation des services
import { authService } from "./services/auth/authService.js";
import { notificationService } from "./services/notifications/notificationService.js";
import { api } from "./services/api/dynamicLoader.js";
import AppState from "../../services/state/state.js";
import CacheService from "./services/cache/cacheService.js";

// Importation des composants
import { initializeDuaTimeCalculator } from "./components/prayer/duaTimeCalculator.js";
import { ChartManager } from "./components/statistics/charts.js";
import { initializeDashboard } from "./components/navigation/dashboard.js";

// Importation des utilitaires
import { navigateTo, switchTab } from "./utils/utils.js";
import { translations } from "./services/notifications/translatNotifications.js";

// Si vous avez déplacé profile.js dans components/user
import { initializeProfile } from "./components/user/profile.js";

// Importation du module featherLoader
import "./utils/featherLoader.js";

// Importation du service mosqueTimesStorageService
import mosqueTimesStorageService from "./services/cache/mosqueTimesStorageService.js";

// Importation de la constante APP_VERSION
import { APP_VERSION } from "./utils/version.js";

// Importation de la constante BUILD_HASH et de la fonction checkBuildHash
import { BUILD_HASH, checkBuildHash } from "./build/build-info.js";

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

  console.log("[DEBUG] Navigation - État complet:", state);

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
  console.log("Initialisation de l'application");

  // Exécuter la vérification build-info.js AVANT toute redirection
  // Vérifier la version du build en premier
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

  // Vérification de version APP_VERSION (pour les mises à jour mineures sans rechargement)
  const storedVersion = localStorage.getItem("app_version");
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

  // Initialisations communes
  initializeUtils();
  initializeNavigation();
  initializeTopNav();

  // Récupère la page actuelle depuis l'URL
  let currentPath = window.location.pathname.substring(1);
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

  // Initialisation des composants
  initializeDuaTimeCalculator();
  initializeDashboard();

  // Initialisation des graphiques si la page contient des éléments de graphique
  if (document.querySelector('[id$="Chart"]')) {
    ChartManager.init();
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

  // Afficher la notification de mise à jour si nécessaire à la fin de l'initialisation
  if (window.showUpdateNotification) {
    notificationService.show("app.updated", "info");
    delete window.showUpdateNotification;
  }
}

// Gestion globale de l'événement "logout" :
// Lorsqu'un logout est déclenché (par exemple via une réponse 401),
// on supprime le token et redirige l'utilisateur vers la page de connexion.
window.addEventListener("logout", () => {
  localStorage.removeItem("token");

  // Vérifier si nous sommes déjà sur welcomepage pour éviter une boucle
  if (window.location.pathname !== "/welcomepage") {
    console.log("Redirection vers welcomepage suite à une déconnexion");
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
  await navigateTo(targetPage, false);
});

// Point d'entrée
document.addEventListener("DOMContentLoaded", initializeApp);

// Gestion globale des erreurs
window.addEventListener("error", (event) => {
  console.error("Erreur globale:", event.error);
});

// Exportation pour utilisation dans d'autres fichiers si nécessaire
export { authService, notificationService, api, CacheService };
