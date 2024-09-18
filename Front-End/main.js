// main.js

// Importation des modules
import { initializeAuth } from './auth.js';
import { initializeNavigation } from './navigation.js';
import { initializeProfile } from './profile.js';
import { initializeTasks } from './tasks.js';
import { initializeTimer } from './timer.js';
import { initializeNotifications } from './notifications.js';
import { initializeUtils, navigateTo, updateNavVisibility, checkAuthOnLoad } from './utils.js';
import { initializeDashboard } from './dashboard.js'; // Importez le module Dashboard
import { initializeSurahSelector } from './surahSelector.js';

// Fonction principale d'initialisation de l'application
function initializeApp() {
    console.log('Initializing app');
    const activePageId = document.querySelector('.page.active')?.id || 'welcomepage';
    console.log('Active page:', activePageId);

    initializeUtils();
    initializeNavigation();
    initializeDashboard(); // Initialisez le Dashboard
    initializeSurahSelector();
    
    updateNavVisibility(activePageId);

    if (activePageId === 'welcomepage') {
        console.log('Initializing auth forms');
        navigateTo('welcomepage');
        initializeAuth();
    } else {
        if (checkAuthOnLoad()) {
            console.log('User authenticated, loading initial page');
            navigateTo(activePageId);
        } else {
            console.log('User not authenticated, navigating to welcome page');
            navigateTo('welcomepage');
        }
    }
}


// Initialisation de l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', initializeApp);
