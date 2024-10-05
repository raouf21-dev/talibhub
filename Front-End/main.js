// main.js

// Importation des modules
import { initializeAuth } from './auth.js';
import { initializeNavigation } from './navigation.js';
import { initializeUtils, navigateTo, updateNavVisibility, checkAuthOnLoad } from './utils.js';
import { initializeDashboard } from './dashboard.js';
import { initializeSurahSelector } from './surahSelector.js';
import { initializeMosqueTime } from './mosqueTime.js';
import { initSurahMemorization } from './surahMemorization.js';

// Fonction pour initialiser les modules nécessitant une authentification
function initializeAuthenticatedModules(token) {
    console.log('Initialisation des modules authentifiés avec le token:', token);
    initializeDashboard();
    initializeSurahSelector();
    initializeMosqueTime(); // Ces fonctions récupèrent le token depuis localStorage
    initSurahMemorization();
    // Ajoutez d'autres modules authentifiés ici
}

// Fonction principale d'initialisation de l'application
async function initializeApp() {
    console.log('Initializing app');
    const activePageId = document.querySelector('.page.active')?.id || 'welcomepage';
    console.log('Active page:', activePageId);

    initializeUtils();
    initializeNavigation(); // Initialiser la navigation en premier

    updateNavVisibility(activePageId);

    if (activePageId === 'welcomepage') {
        console.log('Initializing auth forms');
        navigateTo('welcomepage');
        try {
            const token = await initializeAuth(); // Assurez-vous que initializeAuth retourne une promesse résolue avec le token
            if (token) {
                console.log('Authentification réussie avec le token:', token);
                localStorage.setItem('token', token);
                initializeAuthenticatedModules(token);
                navigateTo('dashboard'); // Naviguer vers une page sécurisée après connexion
            }
        } catch (error) {
            console.error('Erreur lors de l\'authentification:', error);
        }
    } else {
        const token = localStorage.getItem('token');
        console.log('Token récupéré de localStorage:', token);
        if (token) {
            console.log('User authenticated, loading initial page');
            navigateTo(activePageId);
            initializeAuthenticatedModules(token);
        } else {
            console.log('User not authenticated, navigating to welcome page');
            navigateTo('welcomepage');
            try {
                const newToken = await initializeAuth();
                if (newToken) {
                    console.log('Authentification réussie avec le token:', newToken);
                    localStorage.setItem('token', newToken);
                    initializeAuthenticatedModules(newToken);
                    navigateTo('dashboard');
                }
            } catch (error) {
                console.error('Erreur lors de l\'authentification:', error);
            }
        }
    }
}

// Initialisation de l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', initializeApp);
