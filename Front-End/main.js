// Imports principaux pour main.js
import { langConfig } from "./config/apiConfig.js";
import { authService } from "./services/auth/authService.js";
import AppState from "./services/state/state.js";
import CacheService from "./services/cache/cacheService.js";
import mosqueTimesStorageService from "./services/cache/mosqueTimesStorageService.js";

// Importation du système de traductions
import { translationManager } from "./translations/TranslationManager.js";

// Note: Les imports de utils.js sont supprimés pour éviter les dépendances circulaires
// Ces fonctions seront importées dynamiquement quand nécessaire

// ✅ MASQUAGE IMMÉDIAT DE LA SIDEBAR SUR WELCOMEPAGE - FIX pour éviter l'apparition temporaire
(function hideSidebarOnWelcomepage() {
  let currentPath = window.location.pathname.substring(1);
  if (currentPath.endsWith(".html") || !currentPath) {
    currentPath = "welcomepage";
  }

  if (currentPath === "welcomepage") {
    // Ajouter immédiatement la classe pour masquer la sidebar
    document.body.classList.add("on-welcomepage");

    // Fonction pour masquer la sidebar dès qu'elle apparaît dans le DOM
    function hideSidebarWhenReady() {
      const sidebar =
        document.getElementById("nav") || document.querySelector(".sidebar");
      if (sidebar) {
        sidebar.style.display = "none";
      } else {
        // Réessayer si la sidebar n'est pas encore dans le DOM
        setTimeout(hideSidebarWhenReady, 10);
      }
    }

    // Démarrer immédiatement
    hideSidebarWhenReady();
  }
})();

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
 * Fonction principale d'initialisation de l'application.
 */
async function initializeApp() {
  // ✅ NOUVELLE LOGIQUE UNIFIÉE : Nettoyage automatique localStorage obsolète
  try {
    const legacyTokens = ["token", "refreshToken", "tokenExpiry"];
    legacyTokens.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
  } catch (cleanupError) {
    console.error("❌ Erreur nettoyage localStorage:", cleanupError);
  }

  // 🔧 GESTION DE VERSION SIMPLIFIÉE (BUILD_HASH supprimé)
  try {
    const currentVersion = "1.0.0"; // Version statique simple
    const storedVersion = localStorage.getItem("app_version");

    if (storedVersion !== currentVersion) {
      localStorage.setItem("app_version", currentVersion);
    }
  } catch (versionError) {
    console.error("❌ ERREUR traitement version:", versionError);
    // Continuer malgré l'erreur
  }

  // 🔧 AUTHSERVICE CRITIQUE - Disponibilité globale immédiate
  // Rendre authService disponible globalement IMMÉDIATEMENT
  window.authService = authService;

  // Validation simple d'authService
  if (!authService || typeof authService.isAuthenticated !== "function") {
    console.error("❌ authService invalide ou méthodes manquantes");
    throw new Error("authService requis pour l'initialisation");
  }

  try {
    // Initialiser le système de traduction en premier
    await translationManager.init();

    // Détermine la langue et la définit dans le document.
    const userLang = translationManager.getCurrentLanguage();
    document.documentElement.lang = userLang;

    // Récupère la page actuelle depuis l'URL
    let currentPath = window.location.pathname.substring(1);
    if (currentPath.endsWith(".html") || !currentPath) {
      currentPath = "welcomepage";
    }

    // Importer dynamiquement les utilitaires pour éviter les dépendances circulaires
    console.log("📥 Import des utilitaires...");
    const { updateNavVisibility, initializeUtils } = await import(
      "./utils/utils.js"
    );
    const { initializeNavigation } = await import(
      "./components/navigation/navigation.js"
    );
    const { initializeTopNav } = await import(
      "./components/navigation/topnav.js"
    );
    console.log("✅ Imports utilitaires terminés");

    // ✅ AJOUT IMMÉDIAT DES CLASSES CSS POUR ÉVITER L'AFFICHAGE TEMPORAIRE DE LA SIDEBAR
    if (currentPath === "welcomepage") {
      document.body.classList.add("on-welcomepage");
      // Masquer immédiatement la sidebar si elle existe déjà
      const sidebar = document.getElementById("nav");
      if (sidebar) {
        sidebar.style.display = "none";
      }
    }

    // Appliquer immédiatement la visibilité de la navigation
    updateNavVisibility(currentPath);

    // Initialisations communes
    console.log("🔧 Initialisation des utils et navigation...");
    initializeUtils();
    initializeNavigation();

    // ✅ CORRECTION CRITIQUE: Utiliser authService.isAuthenticated() au lieu de checkAuthStatus()
    let isAuthenticated = false;
    try {
      isAuthenticated = authService.isAuthenticated();

      const detailedState = {
        hasToken: !!authService.getToken(),
        hasAuthCookie: authService.hasAuthCookie(),
        cookies: document.cookie,
      };
    } catch (authError) {
      console.error(
        "❌ ERREUR lors de l'appel à authService.isAuthenticated():",
        authError
      );
      console.error("❌ Stack trace:", authError.stack);
      isAuthenticated = false; // valeur par défaut en cas d'erreur
    }

    // Initialiser topnav seulement si nécessaire
    const isWelcomePage = currentPath === "welcomepage";
    if (!isWelcomePage || isAuthenticated) {
      initializeTopNav();
    }

    // Importer dynamiquement les fonctions nécessaires
    const { navigateTo } = await import("./utils/utils.js");
    const { initializeAuth } = await import("./components/auth/auth.js");

    // ✅ CORRECTION: Utiliser authService directement
    if (isAuthenticated) {
      // 🔧 MODIFICATION CRITIQUE: Vérifier les paramètres OAuth
      const urlParams = new URLSearchParams(window.location.search);
      const authStatus = urlParams.get("auth");
      const action = urlParams.get("action");
      const redirect = urlParams.get("redirect");

      if (authStatus === "success") {
        if (action === "complete_profile") {
          // Nettoyer l'URL des paramètres OAuth
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);

          // Déclencher les événements d'authentification
          window.dispatchEvent(new Event("login"));

          // Redirection directe vers dashboard
          await navigateTo("dashboard");
        } else if (redirect === "dashboard") {
          // Nettoyer l'URL des paramètres OAuth
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);

          // Déclencher les événements d'authentification
          window.dispatchEvent(new Event("login"));

          // Redirection directe vers dashboard
          await navigateTo("dashboard");
        } else {
          await navigateTo(currentPath);
        }
      } else {
        await navigateTo(currentPath);
      }
    } else {
      await navigateTo("welcomepage");
      await initializeAuth();
    }

    // Forcer la mise à jour des traductions après l'initialisation
    translationManager.updateDOM();

    // Gestion des événements de navigation - DÉSACTIVÉE
    // La navigation est maintenant gérée par topnav.js pour éviter les doublons
    // document.querySelectorAll("[data-destination]").forEach((element) => {
    //   element.addEventListener("click", (e) => {
    //     const destination = e.currentTarget.dataset.destination;
    //     if (destination) {
    //       navigateTo(destination);
    //     }
    //   });
    // });

    // Gestion de la déconnexion
    document
      .getElementById("logoutBtn")
      ?.addEventListener("click", async (e) => {
        e.preventDefault();

        // ✅ MASQUAGE IMMÉDIAT DE LA SIDEBAR LORS DU LOGOUT

        // Masquer immédiatement la sidebar et changer les classes
        const sidebar =
          document.getElementById("nav") || document.querySelector(".sidebar");
        const body = document.body;

        if (sidebar) {
          sidebar.style.display = "none";
        }

        // Supprimer immédiatement les classes d'authentification
        body.classList.remove("authenticated", "on-dashboard");
        body.classList.add("on-welcomepage");

        await authService.logout();
        window.location.reload();
      });

    // authService déjà rendu global plus tôt dans initializeApp()
  } catch (error) {
    console.error("❌ ERREUR CRITIQUE dans initializeApp():", error);
    console.error("❌ Stack trace:", error.stack);
    throw error;
  }
}

// Gestion globale de l'événement "login" :
// Lorsqu'un login réussi est déclenché, on initialise la topnav
window.addEventListener("login", async () => {
  const { initializeTopNav } = await import(
    "./components/navigation/topnav.js"
  );
  await initializeTopNav();
});

// Gestion globale de l'événement "logout" :
// Lorsqu'un logout est déclenché (par exemple via une réponse 401),
// on supprime le token et redirige l'utilisateur vers la page de connexion.
window.addEventListener("logout", async () => {
  // ✅ MASQUAGE IMMÉDIAT DE LA SIDEBAR LORS DU LOGOUT

  // Masquer immédiatement la sidebar et changer les classes
  const sidebar =
    document.getElementById("nav") || document.querySelector(".sidebar");
  const body = document.body;

  if (sidebar) {
    sidebar.style.display = "none";
  }

  // Supprimer immédiatement les classes d'authentification
  body.classList.remove("authenticated", "on-dashboard");
  body.classList.add("on-welcomepage");

  localStorage.removeItem("token");

  // Vérifier si nous sommes déjà sur welcomepage pour éviter une boucle
  if (window.location.pathname !== "/welcomepage") {
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

  // Utiliser l'authService global si disponible, sinon l'importer
  let authService = window.authService;
  if (!authService) {
    const imported = await import("./services/auth/authService.js");
    authService = imported.authService;
  }

  const isUserAuthenticated = authService.isAuthenticated();
  if (!isUserAuthenticated && targetPage !== "welcomepage") {
    targetPage = "welcomepage";
  } else if (isUserAuthenticated && targetPage === "welcomepage") {
    targetPage = "dashboard";
  }
  const { navigateTo } = await import("./utils/utils.js");
  await navigateTo(targetPage, false);
});

// Point d'entrée
console.log("🎯 Configuration du listener DOMContentLoaded...");
console.log("🎯 État document.readyState:", document.readyState);

// Si le DOM est déjà chargé, exécuter immédiatement
if (document.readyState === "loading") {
  console.log("🎯 DOM en cours de chargement - Configuration listener");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("🎯 DOMContentLoaded déclenché - Appel de initializeApp()");
    initializeApp().catch((error) => {
      console.error("🚨 ERREUR FATALE dans initializeApp():", error);
    });
  });
} else {
  console.log("🎯 DOM déjà chargé - Exécution immédiate de initializeApp()");
  initializeApp().catch((error) => {
    console.error("🚨 ERREUR FATALE dans initializeApp():", error);
  });
}

console.log("🎯 Listener DOMContentLoaded configuré");

// Gestion globale des erreurs
window.addEventListener("error", (event) => {
  console.error("Erreur globale:", event.error);
});

// Rendre le translationManager disponible globalement
window.translationManager = translationManager;

// Helpers globaux pour les traductions (raccourcis pratiques)
window.t = (key, defaultValue) =>
  translationManager.translate(key, defaultValue);
window.tn = (key, variables, defaultValue) =>
  translationManager.translateNotification(key, variables, defaultValue);
window.tSuccess = (key, variables) =>
  translationManager.success(key, variables);
window.tError = (key, variables) => translationManager.error(key, variables);
window.tInfo = (key, variables) => translationManager.info(key, variables);
window.tWarning = (key, variables) =>
  translationManager.warning(key, variables);

// Exportation pour utilisation dans d'autres fichiers si nécessaire
export { authService, CacheService, translationManager };

console.log("✅ Tous les imports terminés avec succès");
