// auth.js

import { switchTab, initializeTabToggle, navigateTo } from './utils.js';

// Initialisation des formulaires d'authentification
function initializeAuth() {
    initializeAuthForms();
    initializeTabToggle();
}

// Fonction pour initialiser les formulaires
function initializeAuthForms() {
    const getStartedBtn = document.getElementById('welcomepage-getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', showAuthForms);
    }

    const signupForm = document.getElementById('welcomepage-signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    const signinForm = document.getElementById('welcomepage-signinForm');
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignin);
    }
}

// Fonction pour afficher les formulaires d'authentification
function showAuthForms() {
    console.log('showAuthForms called');
    const authForms = document.getElementById('welcomepage-auth-forms');
    const getStartedBtn = document.getElementById('welcomepage-getStartedBtn');

    if (authForms && getStartedBtn) {
        getStartedBtn.style.display = 'none';
        // welcomeHero.style.display = 'none'; // Ne plus masquer le héros
        authForms.classList.remove('hidden');
        authForms.style.display = 'block';
        document.body.style.overflow = 'auto';

        setTimeout(() => {
            authForms.classList.add('visible');
        }, 10);

        // Active l'onglet de connexion par défaut
        switchTab('signin');
    }
}


// Fonction d'inscription
async function handleSignup(event) {
    event.preventDefault();

    const username = document.getElementById('welcomepage-username').value;
    const firstName = document.getElementById('welcomepage-firstName').value;
    const lastName = document.getElementById('welcomepage-lastName').value;
    const age = document.getElementById('welcomepage-age').value;
    const gender = document.getElementById('welcomepage-gender').value;
    const email = document.getElementById('welcomepage-email').value;
    const password = document.getElementById('welcomepage-password').value;
    const confirmPassword = document.getElementById('welcomepage-confirmPassword').value;

    if (!username || !firstName || !lastName || !age || !gender || !email || !password || !confirmPassword) {
        alert('Tous les champs doivent être remplis.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas.');
        return;
    }

    try {
        const response = await fetch(`/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                firstName,
                lastName,
                age,
                gender,
                email,
                password
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de l\'inscription');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        alert('Inscription réussie');
        navigateTo('dashboard');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'inscription : ' + error.message);
    }
}

// Fonction de connexion
async function handleSignin(event) {
    event.preventDefault();
    console.log('Signin form submitted');
    const email = document.getElementById('welcomepage-signin-email').value;
    const password = document.getElementById('welcomepage-signin-password').value;

    try {
        const response = await fetch(`/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Email ou mot de passe incorrect');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        console.log('Connexion réussie, redirection vers le tableau de bord');
        alert('Connexion réussie! Redirection vers le tableau de bord...');
        setTimeout(() => navigateTo('dashboard'), 1000);
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la connexion : ' + error.message);
    }
}

// Exportation des fonctions nécessaires
export { initializeAuth };

