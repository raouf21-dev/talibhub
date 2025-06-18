// utils.js

import { authService } from "../services/auth/authService.js";
import {
  initializeStatistics,
  cleanupStatistics,
} from "../components/statistics/statistics.js";

import AppState from "../services/state/state.js";

let currentPage = null; // Pour garder trace de la page actuelle

// Gestion de la navigation via le bouton retour/avant du navigateur
window.addEventListener("popstate", async (event) => {
  let targetPage;
  if (event.state && event.state.pageId) {
    targetPage = event.state.pageId;
  } else {
    targetPage = window.location.pathname.substring(1) || "welcomepage";
  }
  // Si le targetPage ressemble à un fichier HTML, on le remplace par la page par défaut
  if (targetPage.endsWith(".html")) {
    targetPage = "welcomepage";
  }
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated && targetPage !== "welcomepage") {
    targetPage = "welcomepage";
  } else if (isUserAuthenticated && targetPage === "welcomepage") {
    targetPage = "dashboard";
  }
  await navigateTo(targetPage, false);
});

/**
 * Vérifie l'authentification de l'utilisateur.
 * UTILISE AUTHSERVICE GLOBAL - Supprime les conflits
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  try {
    // ✅ CORRECTION: Utiliser authService global pour éviter les conflits
    if (
      window.authService &&
      typeof window.authService.isAuthenticated === "function"
    ) {
      return window.authService.isAuthenticated();
    }

    // Fallback vers cookies si authService non disponible
    console.warn("⚠️ authService non disponible, utilisation cookies fallback");
    return document.cookie.includes("auth=true");
  } catch (error) {
    console.error(
      "Erreur lors de la vérification de l'authentification:",
      error
    );
    return false;
  }
}

/**
 * Masque toutes les pages, affiche la page ciblée, met à jour l'historique et
 * importe dynamiquement le module correspondant à la section.
 * @param {string} pageId - L'identifiant de la page à afficher.
 * @param {boolean} [addToHistory=true] - Ajoute ou non l'entrée dans l'historique.
 * @returns {Promise<boolean>}
 */
// Variable pour éviter les navigations simultanées
let navigationInProgress = false;

export async function navigateTo(pageId, addToHistory = true) {
  // Protection contre les appels simultanés
  if (navigationInProgress) {
    console.warn(
      `[DEBUG] Navigation déjà en cours - Appel ignoré pour: ${pageId}`
    );
    return false;
  }

  // Marquer navigation en cours
  navigationInProgress = true;

  // Ajouter un identifiant unique pour chaque appel
  const navigationId = Math.random().toString(36).substr(2, 9);

  //console.log(`[DEBUG] NavigateTo #${navigationId} - Début`, {
  //pageId,
  //addToHistory,
  //currentPath: window.location.pathname,
  //stack: new Error().stack,
  //time: new Date().toISOString(),
  //});

  // Bloquer toute navigation vers login
  if (pageId === "login") {
    console.warn(
      "[DEBUG] navigateTo - Tentative de navigation vers login bloquée"
    );
    console.warn("[DEBUG] navigateTo - Stack trace:", new Error().stack);
    pageId = "welcomepage";
  }

  // Si le pageId ressemble à un nom de fichier (ex: index.html), on le remplace par 'welcomepage'
  if (pageId.endsWith(".html")) {
    pageId = "welcomepage";
  }

  // Masquer toutes les pages
  document.querySelectorAll(".page").forEach((page) => {
    page.style.display = "none";
    page.classList.remove("active");
  });

  // Afficher la page cible
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.style.display = "block";
    targetPage.classList.add("active");
    if (addToHistory) {
      history.pushState({ pageId }, "", `/${pageId}`);
    }
  } else {
    console.warn(`Page not found: ${pageId}`);
    // Libérer le verrou même en cas d'erreur
    navigationInProgress = false;
    return false;
  }

  // Table d'association des pages nécessitant un module dynamique
  const moduleLoaders = {
    welcomepage: async () => {
      const mod = await import("../components/welcome/welcomePageTurnstile.js");
      await mod.initializeWelcomepageWithTurnstile();
    },
    dashboard: async () => {
      const mod = await import("../components/navigation/dashboard.js");
      await mod.initializeDashboard();
    },
    mosquetime: async () => {
      const mod = await import("../components/mosqueTime/mosqueTime.js");
      await mod.initializeMosqueTime();
    },
    profile: async () => {
      const mod = await import("../components/user/profile.js");
      await mod.initializeProfile();
    },
    statistics: async () => {
      const mod = await import("../components/statistics/statistics.js");
      await mod.initializeStatistics();
    },
    notifications: async () => {
      const mod = await import("../components/notifications/notifications.js");
      await mod.initializeNotifications();
    },
    todoLists: async () => {
      const mod = await import("../components/timer/tasks.js");
      await mod.initializeTasks();
    },
    salatSurahSelector: async () => {
      const mod = await import("../components/quran/surahSelector.js");
      await mod.initializeSurahSelector();
    },
    duaTimeCalculator: async () => {
      const mod = await import("../components/prayer/duaTimeCalculator.js");
      await mod.initializeDuaTimeCalculator();
    },
    surahmemorization: async () => {
      const mod = await import("../components/quran/surahMemorization.js");
      await mod.initSurahMemorization();
    },
    apprentissage: async () => {
      const mod = await import("../components/timer/timer.js");
      await mod.initializeTimer();
    },
  };

  // Si la page a un module associé, le charger
  if (moduleLoaders[pageId]) {
    try {
      await moduleLoaders[pageId]();
    } catch (error) {
      console.error(
        `Erreur lors du chargement du module pour la page ${pageId}:`,
        error
      );
      // Libérer le verrou même en cas d'erreur
      navigationInProgress = false;
      return false;
    }
  } else {
    // Pour les pages qui n'ont pas de module dynamique, aucun chargement n'est nécessaire.
    console.log(`Aucun module dynamique à charger pour la page: ${pageId}`);
  }

  currentPage = pageId;
  updateNavVisibility(pageId);

  // Ajouter un log à la fin de la fonction
  const result = true;

  console.log(`[DEBUG] NavigateTo #${navigationId} - Fin`, {
    pageId,
    result,
    newPath: window.location.pathname,
    time: new Date().toISOString(),
  });

  // Libérer le verrou de navigation
  navigationInProgress = false;

  return result;
}

/**
 * Point d'entrée principal de l'application.
 */
export async function initializeApp() {
  console.log("Initialisation de l'application");
  // Récupérer la page cible depuis l'URL (ou utiliser 'welcomepage' par défaut)
  let path = window.location.pathname.substring(1);
  if (path.endsWith(".html") || !path) {
    path = "welcomepage";
  }
  const isUserAuthenticated = await isAuthenticated();

  console.log("DOMContentLoaded - Auth:", isUserAuthenticated, "Target:", path);

  if (!isUserAuthenticated && path !== "welcomepage") {
    await navigateTo("welcomepage");
  } else if (isUserAuthenticated && path === "welcomepage") {
    await navigateTo("dashboard");
  } else {
    await navigateTo(path);
  }

  // Gestionnaire d'événements pour la déconnexion
  window.addEventListener("logout", async () => {
    // ✅ MASQUAGE IMMÉDIAT DE LA SIDEBAR LORS DU LOGOUT
    console.log(
      "🚪 Gestionnaire logout utils.js - masquage immédiat de la sidebar"
    );

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
    await navigateTo("welcomepage");
    cleanupStatistics();
  });
}

/**
 * Met à jour la visibilité de la barre de navigation en fonction de la page.
 * @param {string} pageId
 */
export function updateNavVisibility(pageId) {
  const sideNav = document.getElementById("nav");
  const topNav = document.querySelector(".top-nav");
  const body = document.body;

  // ✅ NOUVELLE LOGIQUE : Vérification via cookies
  const hasAuth = document.cookie.includes("auth=true");

  // ✅ GESTION DES CLASSES CSS POUR CONTRÔLER LA SIDEBAR
  // Supprimer toutes les classes de navigation précédentes
  body.classList.remove("authenticated", "on-welcomepage", "on-dashboard");

  // Ajouter les classes appropriées selon le contexte
  if (pageId === "welcomepage") {
    body.classList.add("on-welcomepage");
    // Masquer explicitement la sidebar sur welcomepage
    if (sideNav) {
      sideNav.style.display = "none";
    }
  } else {
    // Pour toutes les autres pages
    if (hasAuth) {
      body.classList.add("authenticated");
    }

    // Afficher la sidebar sur les pages authentifiées
    if (sideNav && hasAuth) {
      sideNav.style.display = "block";
    } else if (sideNav) {
      sideNav.style.display = "none";
    }
  }

  if (topNav) {
    // Masquer la topnav sur welcomepage (peu importe l'état d'authentification)
    // La topnav n'est nécessaire que sur les autres pages
    const hideTopNav = pageId === "welcomepage";
    topNav.style.display = hideTopNav ? "none" : "flex";
  }

  console.log(
    `Navigation visibility updated: pageId=${pageId}, hasAuth=${hasAuth}, body classes=${body.className}`
  );
}

/**
 * Vérifie la présence d'une authentification via cookies.
 * @returns {boolean}
 */
export function checkAuthOnLoad() {
  // ✅ NOUVELLE LOGIQUE : Vérification via cookies uniquement
  const hasAuth = document.cookie.includes("auth=true");
  console.log(
    "Authentification vérifiée via cookies dans checkAuthOnLoad:",
    hasAuth
  );
  return hasAuth;
}

/**
 * Charge dynamiquement la page initiale (utilisé en cas de navigation par URL).
 * @param {string} pageId
 */
export function loadInitialPage(pageId) {
  const pageLoaders = {
    welcomepage: async () => {
      console.log("Welcome page loaded");
      try {
        const authModule = await import("../components/auth/auth.js");
        authModule.initializeAuth();
      } catch (error) {
        console.error("Erreur lors du chargement de la page d'accueil:", error);
      }
    },
    profile: async () => {
      try {
        const profileModule = await import("../components/user/profile.js");
        await profileModule.initializeProfile();
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
      }
    },
    statistics: async () => {
      try {
        const statsModule = await import(
          "../components/statistics/statistics.js"
        );
        if (statsModule.cleanupStatistics) {
          statsModule.cleanupStatistics();
        }
        await statsModule.initializeStatistics();
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
      }
    },
    todoLists: async () => {
      try {
        const tasksModule = await import("../components/timer/tasks.js");
        await tasksModule.initializeTasks();
      } catch (error) {
        console.error("Erreur lors du chargement des tâches:", error);
      }
    },
    apprentissage: async () => {
      try {
        const timerModule = await import("../components/timer/timer.js");
        await timerModule.initializeTimer();
      } catch (error) {
        console.error("Erreur lors du chargement du timer:", error);
      }
    },
    notifications: async () => {
      try {
        const notifModule = await import(
          "../components/notifications/notifications.js"
        );
        await notifModule.initializeNotifications();
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
      }
    },
    contactform: async () => {
      try {
        const contactModule = await import("../components/welcome/contact.js");
        await contactModule.initializeContactForm();
      } catch (error) {
        console.error(
          "Erreur lors du chargement du formulaire de contact:",
          error
        );
      }
    },
    aboutus: async () => {
      try {
        console.log("About Us page loaded");
        document.title = "About Us - TalibHub";
        const aboutusPage = document.getElementById("aboutus");
        if (aboutusPage) {
          aboutusPage.style.display = "block";
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la page About Us:", error);
      }
    },
    dashboard: async () => {
      try {
        console.log("Dashboard loading...");
        const dashboardModule = await import(
          "../components/navigation/dashboard.js"
        );
        await dashboardModule.initializeDashboard();
      } catch (error) {
        console.error("Erreur lors du chargement du dashboard:", error);
      }
    },
    mosquetime: async () => {
      try {
        const mosqueModule = await import(
          "../components/mosqueTime/mosqueTime.js"
        );
        await mosqueModule.initializeMosqueTime();
      } catch (error) {
        console.error(
          "Erreur lors du chargement des horaires de mosquée:",
          error
        );
      }
    },
    salatSurahSelector: async () => {
      try {
        const surahModule = await import(
          "../components/quran/surahSelector.js"
        );
        await surahModule.initializeSurahSelector();
      } catch (error) {
        console.error(
          "Erreur lors du chargement du sélecteur de sourates:",
          error
        );
      }
    },
    surahmemorization: async () => {
      try {
        const memorizationModule = await import(
          "../components/quran/surahMemorization.js"
        );
        await memorizationModule.initSurahMemorization();
      } catch (error) {
        console.error("Erreur lors du chargement de la mémorisation:", error);
      }
    },
    duaTimeCalculator: async () => {
      try {
        const duaModule = await import(
          "../components/prayer/duaTimeCalculator.js"
        );
        await duaModule.initializeDuaTimeCalculator();
      } catch (error) {
        console.error(
          "Erreur lors du chargement du calculateur de dua:",
          error
        );
      }
    },
  };

  const loader = pageLoaders[pageId];
  if (loader) {
    loader().catch((error) => {
      console.error(`Erreur lors du chargement de la page ${pageId}:`, error);
    });
  } else {
    console.warn(`Aucun loader défini pour la page: ${pageId}`);
  }
}

/**
 * Initialise les fonctions utilitaires (si nécessaire).
 */
export function initializeUtils() {
  console.log("Initializing utils");
  // Placez ici tout code d'initialisation supplémentaire
}

/**
 * Permet de basculer entre des onglets sur la page (exemple pour la welcomepage).
 * @param {string} tabId - L'identifiant de l'onglet à activer.
 */
export function switchTab(tabId) {
  console.log("Switching to tab:", tabId);
  const tabs = document.querySelectorAll(".welcomepage-tab-btn");
  const contents = document.querySelectorAll(".welcomepage-tab-content");
  tabs.forEach((tab) => {
    const isActive = tab.getAttribute("data-tab") === tabId;
    tab.classList.toggle("active", isActive);
  });
  contents.forEach((content) => {
    const isActive = content.id === `welcomepage-${tabId}Tab`;
    content.classList.toggle("active", isActive);
  });
}

/**
 * Initialise la bascule des onglets (exemple pour la welcomepage).
 */
export function initializeTabToggle() {
  console.log("Initializing tab toggle");
  const tabBtns = document.querySelectorAll(".welcomepage-tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");
      switchTab(tabId);
    });
  });
}

/**
 * Échappe les caractères spéciaux HTML dans une chaîne afin d'éviter les injections.
 * @param {string} str - La chaîne à traiter.
 * @returns {string} La chaîne avec les caractères spéciaux échappés.
 */
export function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, (tag) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return map[tag] || tag;
  });
}

/**
 * Met à jour le contenu textuel d'un élément s'il existe dans le DOM.
 * @param {string} id - L'identifiant de l'élément.
 * @param {string} value - Le contenu textuel à appliquer.
 */
export function updateDOMIfExists(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

// Gestion globale des erreurs
window.addEventListener("error", (event) => {
  console.error("Erreur globale:", event.error);
});
