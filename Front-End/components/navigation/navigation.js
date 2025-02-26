import { navigateTo } from "../../utils/utils.js";

function initializeNavigation() {
  const sidebar = document.getElementById("sidebar");
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const overlay = document.getElementById('sidebarOverlay');
    const navLinks = document.querySelectorAll('.nav-list a');
    const body = document.body;

    // Fonction pour gérer la visibilité du bouton hamburger
    function updateHamburgerVisibility() {
        const welcomePage = document.getElementById('welcomepage');
        const isWelcomePage = welcomePage && welcomePage.classList.contains('active');
        const isNarrowScreen = window.innerWidth <= 1024;

        // Le bouton est visible uniquement si on n'est PAS sur la page welcome ET que l'écran est étroit
        if (!isWelcomePage && isNarrowScreen) {
            hamburgerBtn.style.display = 'block';
        } else {
            hamburgerBtn.style.display = 'none';
        }
    }

    // Observer les changements de page
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                updateHamburgerVisibility();
            }
        });
    });

    // Observer les changements de classe sur toutes les sections
    document.querySelectorAll('.page').forEach(page => {
        observer.observe(page, { attributes: true });
    });

    // Mettre à jour la visibilité lors du redimensionnement de la fenêtre
    window.addEventListener('resize', updateHamburgerVisibility);

    // Vérifier la visibilité initiale
    updateHamburgerVisibility();

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

    // Fermer la sidebar sur les grands écrans
    window.addEventListener('resize', function () {
        if (window.innerWidth > 1024) {
            closeSidebar();
        }
        updateHamburgerVisibility();
    });

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

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();

    try {
        localStorage.removeItem('token');
        window.location.href = '/';

        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
    }
});

export { initializeNavigation };