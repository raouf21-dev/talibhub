// utils.js

import { init as initializeMosqueTime } from './mosqueTime.js';

// Fonction pour naviguer entre les pages
function navigateTo(pageId) {
    console.log('Navigating to:', pageId);

    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.style.display = 'block';
        activePage.classList.add('active');
    }

    updateNavVisibility(pageId);
    loadInitialPage(pageId);
}

// Exposer navigateTo au scope global
window.navigateTo = navigateTo;

// Fonction pour mettre à jour la visibilité de la navigation
function updateNavVisibility(pageId) {
    const navHeader = document.getElementById('nav');
    if (navHeader) {
        navHeader.style.display = (pageId === 'welcomepage') ? 'none' : 'block';
    }
}

// Vérification de l'authentification au chargement
function checkAuthOnLoad() {
    const token = localStorage.getItem('token'); // Utiliser 'token' comme clé
    return !!token;
}

// Fonction pour basculer entre les onglets
function switchTab(tabId) {
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

// Fonction pour initialiser les écouteurs des onglets
function initializeTabToggle() {
    const tabBtns = document.querySelectorAll('.welcomepage-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

// Fonction pour charger la page initiale en fonction de l'ID
function loadInitialPage(pageId) {
    const pageLoaders = {
        'profile': () => import('./profile.js').then(module => module.initializeProfile()),
        'statistics': () => { /* Initialiser les statistiques */ },
        'todoLists': () => import('./tasks.js').then(module => module.initializeTasks()),
        'apprentissage': () => import('./timer.js').then(module => module.initializeTimer()),
        'notifications': () => import('./notifications.js').then(module => module.initializeNotifications()),
        'contactform': () => { /* Initialiser le formulaire de contact */ },
        'dashboard': () => {
            console.log('Dashboard loaded');
        },
        'mosquetime': () => initializeMosqueTime(), // Assurez-vous que cela est correct
        // Ajoutez d'autres pages ici si nécessaire
    };

    const loader = pageLoaders[pageId];
    if (loader) {
        loader();
    }
}

// Fonction pour échapper les caractères spéciaux HTML
function escapeHTML(str) {
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

// Fonction pour mettre à jour le DOM si l'élément existe
function updateDOMIfExists(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

// Fonction pour initialiser les utilitaires
function initializeUtils() {
    // Place any initialization code here if necessary
}

// Exportation des fonctions utilitaires
export {
    switchTab,
    initializeTabToggle,
    navigateTo,
    updateNavVisibility,
    checkAuthOnLoad,
    loadInitialPage,
    escapeHTML,
    updateDOMIfExists,
    initializeUtils,
    // Ajoutez d'autres fonctions si nécessaire
};
