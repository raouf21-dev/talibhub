// utils.js

window.addEventListener('popstate', (event) => {
    if (event.state && event.state.pageId) {
        navigateTo(event.state.pageId, false); // false pour ne pas ajouter une nouvelle entrée dans l'historique
    } else {
        const path = window.location.pathname.substring(1) || 'welcomepage';
        navigateTo(path, false);
    }
});

function isAuthenticated() {
    const token = localStorage.getItem('token');
    return token && token !== 'undefined' && token !== 'null';
}

export function navigateTo(pageId, addToHistory = true) {
    const publicPages = ['welcomepage'];
    if (!isAuthenticated() && !publicPages.includes(pageId)) {
        pageId = 'welcomepage';
    }

    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.style.display = 'block';
        activePage.classList.add('active');
        if (addToHistory) {
            history.pushState({pageId}, '', `/${pageId}`);
        }
    }

    updateNavVisibility(pageId);
    loadInitialPage(pageId);
}

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
    const navHeader = document.getElementById('nav');
    if (navHeader) {
        navHeader.style.display = (pageId === 'welcomepage') ? 'none' : 'block';
    }
}

export function checkAuthOnLoad() {
    const token = localStorage.getItem('token'); // Utiliser 'token' comme clé
    console.log('Token récupéré depuis localStorage dans checkAuthOnLoad:', token);
    return !!token;
}

export function loadInitialPage(pageId) {
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
        'mosquetime': () => import('./mosqueTime.js').then(module => module.initializeMosqueTime()),
        'salatSurahSelector': () => import('./surahSelector.js').then(module => module.initializeSurahSelector()),
        'surahmemorization': () => import('./surahMemorization.js').then(module => module.initSurahMemorization()),
        'duaTimeCalculator': () => import('./duaTimeCalculator.js').then(module => module.initializeDuaTimeCalculator()), // Assurez-vous que ce module existe
    };

    const loader = pageLoaders[pageId];
    if (loader) {
        loader();
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


