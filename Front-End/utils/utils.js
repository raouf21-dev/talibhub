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
    return document.cookie.includes("auth=true");
  } catch (error) {
    // Erreur lors de la vérification de l'authentification
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
    return false;
  }

  // Marquer navigation en cours
  navigationInProgress = true;

  // Ajouter un identifiant unique pour chaque appel
  const navigationId = Math.random().toString(36).substr(2, 9);

  // Bloquer toute navigation vers login
  if (pageId === "login") {
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
      // Erreur lors du chargement du module
      // Libérer le verrou même en cas d'erreur
      navigationInProgress = false;
      return false;
    }
  }

  currentPage = pageId;
  updateNavVisibility(pageId);

  // Ajouter un log à la fin de la fonction
  const result = true;

  // Libérer le verrou de navigation
  navigationInProgress = false;

  return result;
}

/**
 * Point d'entrée principal de l'application.
 */
export async function initializeApp() {
  // Récupérer la page cible depuis l'URL (ou utiliser 'welcomepage' par défaut)
  let path = window.location.pathname.substring(1);
  if (path.endsWith(".html") || !path) {
    path = "welcomepage";
  }
  const isUserAuthenticated = await isAuthenticated();

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

    // Laisser le CSS gérer l'affichage de la sidebar selon la taille d'écran
    if (sideNav) {
      if (hasAuth) {
        // Pour les utilisateurs authentifiés, supprimer le style inline
        // pour laisser le CSS gérer l'affichage responsive
        sideNav.style.display = "";
      } else {
        // Pour les utilisateurs non authentifiés, masquer la sidebar
        sideNav.style.display = "none";
      }
    }
  }

  if (topNav) {
    // Masquer la topnav sur welcomepage (peu importe l'état d'authentification)
    // La topnav n'est nécessaire que sur les autres pages
    const hideTopNav = pageId === "welcomepage";
    topNav.style.display = hideTopNav ? "none" : "flex";
  }
}

/**
 * Vérifie la présence d'une authentification via cookies.
 * @returns {boolean}
 */
export function checkAuthOnLoad() {
  // ✅ NOUVELLE LOGIQUE : Vérification via cookies uniquement
  const hasAuth = document.cookie.includes("auth=true");
  return hasAuth;
}

/**
 * Charge dynamiquement la page initiale (utilisé en cas de navigation par URL).
 * @param {string} pageId
 */
export function loadInitialPage(pageId) {
  const pageLoaders = {
    welcomepage: async () => {
      try {
        const authModule = await import("../components/auth/auth.js");
        authModule.initializeAuth();
      } catch (error) {
        // Erreur lors du chargement de la page d'accueil
      }
    },
    profile: async () => {
      try {
        const profileModule = await import("../components/user/profile.js");
        await profileModule.initializeProfile();
      } catch (error) {
        // Erreur lors du chargement du profil
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
        // Erreur lors du chargement des statistiques
      }
    },
    todoLists: async () => {
      try {
        const tasksModule = await import("../components/timer/tasks.js");
        await tasksModule.initializeTasks();
      } catch (error) {
        // Erreur lors du chargement des tâches
      }
    },
    apprentissage: async () => {
      try {
        const timerModule = await import("../components/timer/timer.js");
        await timerModule.initializeTimer();
      } catch (error) {
        // Erreur lors du chargement du timer
      }
    },
    notifications: async () => {
      try {
        const notifModule = await import(
          "../components/notifications/notifications.js"
        );
        await notifModule.initializeNotifications();
      } catch (error) {
        // Erreur lors du chargement des notifications
      }
    },
    contactform: async () => {
      try {
        const contactModule = await import("../components/welcome/contact.js");
        await contactModule.initializeContactForm();
      } catch (error) {
        // Erreur lors du chargement du formulaire de contact
      }
    },
    aboutus: async () => {
      try {
        document.title = "About Us - TalibHub";
        const aboutusPage = document.getElementById("aboutus");
        if (aboutusPage) {
          aboutusPage.style.display = "block";
        }
      } catch (error) {
        // Erreur lors du chargement de la page About Us
      }
    },
    dashboard: async () => {
      try {
        const dashboardModule = await import(
          "../components/navigation/dashboard.js"
        );
        await dashboardModule.initializeDashboard();
      } catch (error) {
        // Erreur lors du chargement du dashboard
      }
    },
    mosquetime: async () => {
      try {
        const mosqueModule = await import(
          "../components/mosqueTime/mosqueTime.js"
        );
        await mosqueModule.initializeMosqueTime();
      } catch (error) {
        // Erreur lors du chargement des horaires de mosquée
      }
    },
    salatSurahSelector: async () => {
      try {
        const surahModule = await import(
          "../components/quran/surahSelector.js"
        );
        await surahModule.initializeSurahSelector();
      } catch (error) {
        // Erreur lors du chargement du sélecteur de sourates
      }
    },
    surahmemorization: async () => {
      try {
        const memorizationModule = await import(
          "../components/quran/surahMemorization.js"
        );
        await memorizationModule.initSurahMemorization();
      } catch (error) {
        // Erreur lors du chargement de la mémorisation
      }
    },
    duaTimeCalculator: async () => {
      try {
        const duaModule = await import(
          "../components/prayer/duaTimeCalculator.js"
        );
        await duaModule.initializeDuaTimeCalculator();
      } catch (error) {
        // Erreur lors du chargement du calculateur de dua
      }
    },
  };

  const loader = pageLoaders[pageId];
  if (loader) {
    loader().catch((error) => {
      // Erreur lors du chargement de la page
    });
  }
}

/**
 * Initialise les fonctions utilitaires (si nécessaire).
 */
export function initializeUtils() {
  // Placez ici tout code d'initialisation supplémentaire
}

/**
 * Permet de basculer entre des onglets sur la page (exemple pour la welcomepage).
 * @param {string} tabId - L'identifiant de l'onglet à activer.
 */
export function switchTab(tabId) {
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
  // Erreur globale détectée
});
