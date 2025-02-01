// utils.js

import { authService } from './Services/authService.js';
import { initializeStatistics, cleanupStatistics } from './statistics.js';

let currentPage = null; // Pour garder trace de la page actuelle

// Gestion de la navigation via le bouton retour/avant du navigateur
window.addEventListener('popstate', async (event) => {
  let targetPage;
  if (event.state && event.state.pageId) {
    targetPage = event.state.pageId;
  } else {
    targetPage = window.location.pathname.substring(1) || 'welcomepage';
  }
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated && targetPage !== 'welcomepage') {
    targetPage = 'welcomepage';
  } else if (isUserAuthenticated && targetPage === 'welcomepage') {
    targetPage = 'dashboard';
  }
  await navigateTo(targetPage, false);
});

/**
 * Vérifie l'authentification de l'utilisateur.
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  try {
    return await authService.checkAuth();
  } catch (error) {
    console.error('Erreur de vérification auth:', error);
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
export async function navigateTo(pageId, addToHistory = true) {
    // Masquer toutes les pages
    document.querySelectorAll('.page').forEach(page => {
      page.style.display = 'none';
      page.classList.remove('active');
    });
    
    // Afficher la page cible
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.style.display = 'block';
      targetPage.classList.add('active');
      if (addToHistory) {
        history.pushState({ pageId }, '', `/${pageId}`);
      }
    } else {
      console.warn(`Page not found: ${pageId}`);
      return false;
    }
    
    // Import dynamique uniquement pour la section ciblée
    try {
      switch (pageId) {
        case 'welcomepage': {
          const welcomeModule = await import('./welcomepage.js');
          await welcomeModule.initializeWelcomepage();
          break;
        }
        case 'dashboard': {
          const dashboardModule = await import('./dashboard.js');
          await dashboardModule.initializeDashboard();
          break;
        }
        case 'mosquetime': {
          const mosqueModule = await import('./mosqueTime.js');
          await mosqueModule.initializeMosqueTime();
          break;
        }
        case 'profile': {
          const profileModule = await import('./profile.js');
          await profileModule.initializeProfile();
          break;
        }
        case 'statistics': {
          const statsModule = await import('./statistics.js');
          await statsModule.initializeStatistics();
          break;
        }
        case 'notifications': {
          const notifModule = await import('./notifications.js');
          await notifModule.initializeNotifications();
          break;
        }
        // Nouveaux cas ajoutés
        case 'todoLists': {
          const tasksModule = await import('./tasks.js');
          await tasksModule.initializeTasks();
          break;
        }
        case 'salatSurahSelector': {
          const surahSelectorModule = await import('./surahSelector.js');
          await surahSelectorModule.initializeSurahSelector();
          break;
        }
        case 'duaTimeCalculator': {
          const duaTimeModule = await import('./duaTimeCalculator.js');
          await duaTimeModule.initializeDuaTimeCalculator();
          break;
        }
        case 'surahmemorization': {
          const surahMemorizationModule = await import('./surahMemorization.js');
          await surahMemorizationModule.initSurahMemorization();
          break;
        }
        case 'apprentissage': {
          const timerModule = await import('./timer.js');
          await timerModule.initializeTimer();
          break;
        }
        default:
          console.warn(`Aucun loader défini pour la page: ${pageId}`);
      }
    } catch (error) {
      console.error(`Erreur lors du chargement du module pour la page ${pageId}:`, error);
    }
    
    currentPage = pageId;
    updateNavVisibility(pageId);
    return true;
  }
  

/**
 * Point d'entrée principal de l'application.
 */
export async function initializeApp() {
  console.log("Initialisation de l'application");
  // Déterminez la page cible à partir de l'URL (ou utilisez 'welcomepage' par défaut)
  const path = window.location.pathname.substring(1) || 'welcomepage';
  const isUserAuthenticated = await isAuthenticated();
  
  console.log('DOMContentLoaded - Auth:', isUserAuthenticated, 'Target:', path);
  
  if (!isUserAuthenticated && path !== 'welcomepage') {
    await navigateTo('welcomepage');
  } else if (isUserAuthenticated && path === 'welcomepage') {
    await navigateTo('dashboard');
  } else {
    await navigateTo(path);
  }
  
  // Gestionnaire d'événements pour la déconnexion
  window.addEventListener("logout", async () => {
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
  const sideNav = document.getElementById('nav');
  if (sideNav) {
    sideNav.style.display = (pageId === 'welcomepage') ? 'none' : 'block';
  }
  
  const topNav = document.querySelector('.top-nav');
  if (topNav) {
    topNav.style.display = (pageId === 'welcomepage') ? 'none' : 'flex';
  }
}

/**
 * Vérifie la présence d'un token d'authentification dans le localStorage.
 * @returns {boolean}
 */
export function checkAuthOnLoad() {
  const token = localStorage.getItem('token');
  console.log('Token récupéré depuis localStorage dans checkAuthOnLoad:', token);
  return !!token;
}

/**
 * Charge dynamiquement la page initiale (utilisé en cas de navigation par URL).
 * Cette fonction peut être utilisée en complément de navigateTo.
 * @param {string} pageId
 */
export function loadInitialPage(pageId) {
  const pageLoaders = {
    'welcomepage': async () => {
      console.log('Welcome page loaded');
      try {
        const authModule = await import('./auth.js');
        authModule.initializeAuth();
      } catch (error) {
        console.error('Erreur lors du chargement de la page d\'accueil:', error);
      }
    },
    'profile': async () => {
      try {
        const profileModule = await import('./profile.js');
        await profileModule.initializeProfile();
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      }
    },
    'statistics': async () => {
      try {
        const statsModule = await import('./statistics.js');
        if (statsModule.cleanupStatistics) {
          statsModule.cleanupStatistics();
        }
        await statsModule.initializeStatistics();
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    },
    'todoLists': async () => {
      try {
        const tasksModule = await import('./tasks.js');
        await tasksModule.initializeTasks();
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
      }
    },
    'apprentissage': async () => {
      try {
        const timerModule = await import('./timer.js');
        await timerModule.initializeTimer();
      } catch (error) {
        console.error('Erreur lors du chargement du timer:', error);
      }
    },
    'notifications': async () => {
      try {
        const notifModule = await import('./notifications.js');
        await notifModule.initializeNotifications();
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    },
    'contactform': async () => {
      try {
        const contactModule = await import('./contact.js');
        await contactModule.initializeContactForm();
      } catch (error) {
        console.error('Erreur lors du chargement du formulaire de contact:', error);
      }
    },
    'aboutus': async () => {
      try {
        console.log('About Us page loaded');
        document.title = 'About Us - TalibHub';
        const aboutusPage = document.getElementById('aboutus');
        if (aboutusPage) {
          aboutusPage.style.display = 'block';
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la page About Us:', error);
      }
    },
    'dashboard': async () => {
      try {
        console.log('Dashboard loading...');
        const dashboardModule = await import('./dashboard.js');
        await dashboardModule.initializeDashboard();
      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error);
      }
    },
    'mosquetime': async () => {
      try {
        const mosqueModule = await import('./mosqueTime.js');
        await mosqueModule.initializeMosqueTime();
      } catch (error) {
        console.error('Erreur lors du chargement des horaires de mosquée:', error);
      }
    },
    'salatSurahSelector': async () => {
      try {
        const surahModule = await import('./surahSelector.js');
        await surahModule.initializeSurahSelector();
      } catch (error) {
        console.error('Erreur lors du chargement du sélecteur de sourates:', error);
      }
    },
    'surahmemorization': async () => {
      try {
        const memorizationModule = await import('./surahMemorization.js');
        await memorizationModule.initSurahMemorization();
      } catch (error) {
        console.error('Erreur lors du chargement de la mémorisation:', error);
      }
    },
    'duaTimeCalculator': async () => {
      try {
        const duaModule = await import('./duaTimeCalculator.js');
        await duaModule.initializeDuaTimeCalculator();
      } catch (error) {
        console.error('Erreur lors du chargement du calculateur de dua:', error);
      }
    }
  };

  const loader = pageLoaders[pageId];
  if (loader) {
    loader().catch(error => {
      console.error(`Erreur lors du chargement de la page ${pageId}:`, error);
    });
  } else {
    console.warn(`Aucun loader défini pour la page: ${pageId}`);
  }
}

/**
 * Initialisation de fonctions utilitaires (si nécessaire).
 */
export function initializeUtils() {
  console.log('Initializing utils');
  // Place any additional initialization code here
}

/**
 * Permet de basculer entre des onglets (pour les pages avec des tabs, ex. welcomepage).
 * @param {string} tabId 
 */
export function switchTab(tabId) {
  console.log('Switching to tab:', tabId);
  const tabs = document.querySelectorAll('.welcomepage-tab-btn');
  const contents = document.querySelectorAll('.welcomepage-tab-content');
  tabs.forEach(tab => {
    const isActive = tab.getAttribute('data-tab') === tabId;
    tab.classList.toggle('active', isActive);
  });
  contents.forEach(content => {
    const isActive = content.id === `welcomepage-${tabId}Tab`;
    content.classList.toggle('active', isActive);
  });
}

/**
 * Initialise la bascule des onglets (pour la page welcomepage par exemple).
 */
export function initializeTabToggle() {
  console.log('Initializing tab toggle');
  const tabBtns = document.querySelectorAll('.welcomepage-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const tabId = this.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
}

/**
 * Échappe les caractères spéciaux HTML dans une chaîne.
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

/**
 * Met à jour le contenu textuel d'un élément si celui-ci existe.
 * @param {string} id 
 * @param {string} value 
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