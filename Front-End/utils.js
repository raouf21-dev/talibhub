// utils.js

import { authService } from './Services/authService.js';
import { initializeStatistics, cleanupStatistics } from './statistics.js';

let currentPage = null; // Pour garder trace de la page actuelle


window.addEventListener('popstate', (event) => {
    if (event.state && event.state.pageId) {
        navigateTo(event.state.pageId, false); // false pour ne pas ajouter une nouvelle entrée dans l'historique
    } else {
        const path = window.location.pathname.substring(1) || 'welcomepage';
        navigateTo(path, false);
    }
});

export async function isAuthenticated() {
    try {
        // Vérifie à la fois les cookies et fait une vérification serveur
        return await authService.checkAuth();
    } catch (error) {
        console.error('Erreur de vérification auth:', error);
        return false;
    }
}

export async function navigateTo(pageId, addToHistory = true) {
    const publicPages = ['welcomepage'];

    // Vérifier l'authentification
    const isUserAuthenticated = await isAuthenticated();

    console.log('État authentification:', isUserAuthenticated, 'Page demandée:', pageId);

    // Si l'utilisateur n'est pas authentifié et essaie d'accéder à une page protégée
    if (!isUserAuthenticated && !publicPages.includes(pageId)) {
        pageId = 'welcomepage';
    }
    // Si l'utilisateur est authentifié et qu'on essaie d'aller sur welcomepage, rediriger vers dashboard
    else if (isUserAuthenticated && pageId === 'welcomepage') {
        pageId = 'dashboard';
    }

    // Nettoyage de la page statistics si on la quitte
    if (currentPage === 'statistics' && pageId !== 'statistics') {
        await cleanupStatistics();
    }

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

    // Mettre à jour la page courante
    currentPage = pageId;

    // Initialiser les statistiques si on arrive sur la page statistics
    if (pageId === 'statistics') {
        await initializeStatistics();
    }

    updateNavVisibility(pageId);
    await loadInitialPage(pageId);
    return true;
}

// Initialisation au chargement du DOM
document.addEventListener("DOMContentLoaded", async () => {
    // Récupérer le chemin actuel de l'URL
    const path = window.location.pathname.substring(1);
    const targetPage = path || 'welcomepage';
    
    // Vérifier l'authentification
    const isUserAuthenticated = await isAuthenticated();
    
    console.log('DOMContentLoaded - Auth:', isUserAuthenticated, 'Target:', targetPage);
    
    if (!isUserAuthenticated && targetPage !== 'welcomepage') {
        // Si non authentifié et pas sur welcomepage, rediriger vers welcomepage
        navigateTo('welcomepage');
    } else if (isUserAuthenticated && targetPage === 'welcomepage') {
        // Si authentifié et sur welcomepage, rediriger vers dashboard
        navigateTo('dashboard');
    } else {
        // Sinon, aller vers la page cible
        navigateTo(targetPage);
    }
});

// Gérer le "popstate" (bouton retour/avant du navigateur)
window.addEventListener('popstate', async (event) => {
    let targetPage;
    if (event.state && event.state.pageId) {
        targetPage = event.state.pageId;
    } else {
        targetPage = window.location.pathname.substring(1) || 'welcomepage';
    }

    // Vérifier l'authentification avant la navigation
    const isUserAuthenticated = await isAuthenticated();
    if (!isUserAuthenticated && targetPage !== 'welcomepage') {
        targetPage = 'welcomepage';
    } else if (isUserAuthenticated && targetPage === 'welcomepage') {
        targetPage = 'dashboard';
    }

    navigateTo(targetPage, false);
});

// Gérer le chargement initial
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname.substring(1);
    const targetPage = path || 'welcomepage';
    
    if (!isAuthenticated() && !['welcomepage'].includes(targetPage)) {
        navigateTo('welcomepage');
    } else {
        navigateTo(targetPage);
    }
});

export function updateNavVisibility(pageId) {
    // Gestion de la barre latérale
    const sideNav = document.getElementById('nav');
    if (sideNav) {
        sideNav.style.display = (pageId === 'welcomepage') ? 'none' : 'block';
    }

    // Gestion de la barre supérieure
    const topNav = document.querySelector('.top-nav');
    if (topNav) {
        topNav.classList.toggle('top-nav-hidden', pageId === 'welcomepage');
    }
}

export function checkAuthOnLoad() {
    const token = localStorage.getItem('token');
    console.log('Token récupéré depuis localStorage dans checkAuthOnLoad:', token);
    return !!token;
}

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
        // Nettoyer avant d'initialiser
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
                // Initialisation spécifique pour About Us si nécessaire
                document.title = 'About Us - TalibHub';
                // Assurez-vous que la page est visible
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

export function initializeUtils() {
    console.log('Initializing utils');
    // Place any initialization code here if necessary
}

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

export function updateDOMIfExists(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

export async function initializeApp() {
    console.log("Initialisation de l'application");

    const userLang = navigator.language.split('-')[0];
    const lang = langConfig.SUPPORTED_LANGS.includes(userLang) ? userLang : langConfig.DEFAULT_LANG;
    document.documentElement.lang = lang;

    initializeUtils();
    initializeNavigation();

    try {
        // Vérifier l'authentification au chargement
        const isAuthenticated = await authService.checkAuth();
        
        const currentPath = window.location.pathname.substring(1) || 'welcomepage';
        
        if (isAuthenticated) {
            console.log("Utilisateur authentifié");
            if (currentPath === 'welcomepage') {
                navigateTo('dashboard');
            } else {
                navigateTo(currentPath);
            }
            initializeAuthenticatedModules();
        } else {
            console.log("Utilisateur non authentifié");
            navigateTo('welcomepage');
            await initializeAuth();
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        navigateTo('welcomepage');
    }

    // Gestionnaire d'événements pour la déconnexion
    window.addEventListener("logout", async () => {
        try {
            await authService.logout();
            navigateTo("welcomepage");
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    });
}

// Gestion des erreurs globales
window.addEventListener("error", (event) => {
    console.error("Erreur globale:", event.error);
});


