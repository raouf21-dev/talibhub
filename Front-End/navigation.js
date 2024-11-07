// navigation.js

import { navigateTo } from './utils.js';

function initializeNavigation() {
    const sidebar = document.getElementById('sidebar');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const overlay = document.getElementById('sidebarOverlay');
    const navLinks = document.querySelectorAll('.nav-list a');
    const body = document.body;

    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        body.classList.add('menu-open');
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        body.classList.remove('menu-open');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 300);
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openSidebar);
    }
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', closeSidebar);
    }
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const destination = this.getAttribute('data-destination');
            if (destination) {
                navigateTo(destination);
            }
            closeSidebar();
        });
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 1024) {
            closeSidebar();
        }
    });

    // Ajouter les écouteurs d'événements pour les cartes du tableau de bord
    setupDashboardCardClicks();
}

function setupDashboardCardClicks() {
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    console.log(`Found ${dashboardCards.length} dashboard cards`);

    dashboardCards.forEach(card => {
        card.addEventListener('click', () => {
            const destination = card.getAttribute('data-destination');
            console.log(`Clicked on card with destination: ${destination}`);
            if (destination) {
                navigateTo(destination);
            } else {
                console.warn('Aucune destination trouvée pour cette carte.');
            }
        });
    });
}

// Exportation des fonctions nécessaires
export { initializeNavigation };
