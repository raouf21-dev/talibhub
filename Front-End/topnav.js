import { navigateTo } from './utils.js';
import { api } from './dynamicLoader.js';
import { authService } from './Services/authService.js';

async function initializeTopNav() {
    // Éléments du DOM
    const profileDropdown = document.getElementById('profile-dropdown');
    const profileButton = document.getElementById('profile-button');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const themeToggle = document.getElementById('theme-toggle');
    const logoutBtn = document.getElementById('logoutBtn');
    const langButtons = document.querySelectorAll('.lang-btn');

    // Toggle dropdown du profil
    if (profileButton) {
        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown?.classList.toggle('show');
        });
    }

    // Fermer dropdown si clic extérieur
    document.addEventListener('click', (e) => {
        if (!profileButton?.contains(e.target)) {
            profileDropdown?.classList.remove('show');
        }
    });

    // Gestionnaire de navigation pour les liens du dropdown
    const navigationLinks = document.querySelectorAll('[data-destination]');
    navigationLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            const destination = e.currentTarget.getAttribute('data-destination');
            if (destination) {
                // Fermer le dropdown après la navigation
                profileDropdown?.classList.remove('show');
                await navigateTo(destination);
            }
        });
    });

    // Toggle du menu hamburger
    if (hamburgerBtn) {
        const sideNav = document.getElementById('nav');
        hamburgerBtn.addEventListener('click', () => {
            sideNav?.classList.toggle('nav-open');
        });
    }

    // Gestionnaire du thème
    if (themeToggle) {
        // Charger le thème initial
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', currentTheme);
        themeToggle.checked = currentTheme === 'dark';

        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Gestionnaire de déconnexion
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await authService.logout();
                localStorage.removeItem('token');
                window.dispatchEvent(new Event('logout'));
                await navigateTo('welcomepage');
            } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
            }
        });
    }

    // Gestionnaire de changement de langue
    langButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const newLang = button.getAttribute('data-lang');
            if (newLang) {
                try {
                    // Sauvegarder la préférence de langue
                    localStorage.setItem('preferredLanguage', newLang);
                    document.documentElement.lang = newLang;
                    
                    // Recharger la page pour appliquer les changements
                    window.location.reload();
                } catch (error) {
                    console.error('Erreur lors du changement de langue:', error);
                }
            }
        });
    });

    // Charger et afficher le pseudo de l'utilisateur
    try {
        const user = await api.get('/auth/profile');
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay && user.username) {
            usernameDisplay.textContent = user.username;
        }
    } catch (error) {
        console.error('Erreur lors du chargement du pseudo:', error);
    }

    // Gestionnaire des raccourcis clavier
    document.addEventListener('keydown', (e) => {
        // Fermer le dropdown avec Escape
        if (e.key === 'Escape' && profileDropdown?.classList.contains('show')) {
            profileDropdown.classList.remove('show');
        }
    });
}

export { initializeTopNav };