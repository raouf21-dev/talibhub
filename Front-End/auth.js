// auth.js
import { switchTab, initializeTabToggle, navigateTo } from "./utils.js";
import { BotTracker } from "./bot-tracker.js";
import CaptchaHandler from './captcha.js';
import { api } from './dynamicLoader.js';
import TermsHandler from './terms.js';
import { notificationService } from './Services/notificationService.js';
import { authService } from './Services/authService.js';
import { countriesCache } from './Services/Caches/cacheCountries.js';  // Cache global pour les pays

// Flag global pour empêcher une double initialisation du champ "pays"
let isCountryInputInitialized = false;

// Instances globales
const botTracker = new BotTracker();
const captchaHandler = new CaptchaHandler();
let termsHandler;

/* =========================
   INITIALISATION DE L'AUTH
   ========================= */
function initializeAuth() {
    initializeAuthForms();
    initializeTabToggle();
    initializeCountryInput(); // Appelé une seule fois grâce au flag
    termsHandler = new TermsHandler();
}

/* ------------------ Initialisation des formulaires d’authentification ------------------ */
function initializeAuthForms() {
    const getStartedBtn = document.getElementById("welcomepage-getStartedBtn");
    if (getStartedBtn) {
        getStartedBtn.addEventListener("click", showAuthForms);
    }

    const signupForm = document.getElementById("welcomepage-signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", handleSignup);
    }

    const signinForm = document.getElementById("welcomepage-signinForm");
    if (signinForm) {
        signinForm.addEventListener("submit", handleSignin);
    }

    initializeEmailValidation();
}

/* ------------------ Validation de l’email (et du confirmEmail) ------------------ */
function initializeEmailValidation() {
    const emailInput = document.getElementById("welcomepage-email");
    const confirmEmailInput = document.getElementById("welcomepage-confirmEmail");

    if (!emailInput || !confirmEmailInput) {
        // Champs e-mail introuvables
        return;
    }

    function validateEmails() {
        const email = emailInput.value.trim().toLowerCase();
        const confirmEmail = confirmEmailInput.value.trim().toLowerCase();

        if (confirmEmail === "") {
            confirmEmailInput.setCustomValidity("");
            return;
        }

        if (email !== confirmEmail) {
            // Emails non concordants
            notificationService.show('auth.email.mismatch', 'warning');
            confirmEmailInput.style.borderColor = "red";
            confirmEmailInput.setCustomValidity("Les adresses e-mail ne correspondent pas");
        } else {
            confirmEmailInput.setCustomValidity("");
            confirmEmailInput.style.borderColor = "green";
        }

        confirmEmailInput.reportValidity();
    }

    emailInput.addEventListener("input", validateEmails);
    confirmEmailInput.addEventListener("input", validateEmails);
}

/* ------------------ Affichage des formulaires d’authentification ------------------ */
function showAuthForms() {
    const authForms = document.getElementById("welcomepage-auth-forms");
    const getStartedBtn = document.getElementById("welcomepage-getStartedBtn");

    if (authForms && getStartedBtn) {
        // Masquer le bouton Get Started et afficher les formulaires
        getStartedBtn.style.display = "none";
        authForms.classList.remove("hidden");
        authForms.style.display = "block";
        document.body.style.overflow = "auto";

        setTimeout(() => {
            authForms.classList.add("visible");
        }, 10);

        // Forcer l'affichage de l'onglet "Sign In" (ou "Sign Up" selon votre choix) en synchronisant les onglets
        // Par exemple, ici on choisit d'activer "signin" :
        switchTab("signin");
    }
}

/* ------------------ Gestion de l’inscription (sign-up) ------------------ */
async function handleSignup(event) {
    event.preventDefault();

    try {
        // Vérification des CGU
        if (!termsHandler.isAccepted()) {
            notificationService.show('auth.terms.required', 'warning');
            return;
        }

        // Vérification du CAPTCHA
        const isCaptchaValid = await captchaHandler.verify();
        if (!isCaptchaValid) {
            notificationService.show('auth.captcha.required', 'warning');
            return;
        }

        // Message de validation en cours
        notificationService.show('auth.form.validating', 'info');

        const metrics = botTracker.getMetrics();

        const formData = {
            username: document.getElementById("welcomepage-username").value.trim(),
            firstName: document.getElementById("welcomepage-firstName").value.trim(),
            lastName: document.getElementById("welcomepage-lastName").value.trim(),
            age: document.getElementById("welcomepage-age").value.trim(),
            gender: document.getElementById("welcomepage-gender").value.trim(),
            country: document.getElementById("welcomepage-country").value.trim(),
            email: document.getElementById("welcomepage-email").value.trim(),
            confirmEmail: document.getElementById("welcomepage-confirmEmail").value.trim(),
            password: document.getElementById("welcomepage-password").value,
            confirmPassword: document.getElementById("welcomepage-confirmPassword").value,
            metrics: metrics,
        };

        // Vérification des champs obligatoires
        if (!formData.username || !formData.email || !formData.password) {
            notificationService.show('auth.required.fields', 'warning');
            return;
        }

        // Vérification du mot de passe
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.isValid) {
            notificationService.show(passwordValidation.errors.join('\n'), 'warning');
            return;
        }

        // Vérification de concordance d'email
        if (formData.email !== formData.confirmEmail) {
            notificationService.show('auth.email.mismatch', 'warning');
            return;
        }

        // Appel API pour inscription
        const response = await authService.register(formData);
        
        if (response && response.token) {
            // Déclencher l'événement login
            window.dispatchEvent(new Event('login'));
            notificationService.show('auth.signup.success', 'success');
            
            setTimeout(() => {
                navigateTo('dashboard');
            }, 1500);
        } else {
            throw new Error("Token non reçu");
        }

    } catch (error) {
        console.error("Erreur:", error);
        notificationService.show('auth.signup.error', 'error', 0);
    }

    botTracker.reset();
}

function validatePassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push("Le mot de passe doit contenir au moins 6 caractères");
    }
    if (!hasUpperCase) {
        errors.push("Le mot de passe doit contenir au moins une majuscule");
    }
    if (!hasSpecialChar) {
        errors.push("Le mot de passe doit contenir au moins un caractère spécial");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/* ------------------ Gestion de la connexion (sign-in) ------------------ */
async function handleSignin(event) {
    event.preventDefault();
    
    try {
        const email = document.getElementById("welcomepage-signin-email").value.trim();
        const password = document.getElementById("welcomepage-signin-password").value.trim();

        const response = await authService.login(email, password);
        if (response && response.token) {
            // Déclencher l'événement login
            window.dispatchEvent(new Event('login'));
            notificationService.show('auth.signin.success', 'success');
            setTimeout(() => {
                navigateTo("dashboard");
            }, 1500);
        } else {
            throw new Error("Token non reçu");
        }
    } catch (error) {
        console.error("Erreur de connexion:", error);
        notificationService.show('auth.signin.error', 'error', 0);
    }
}

/* ------------------ Initialisation du champ "pays" (country) ------------------ */
function initializeCountryInput() {
    // Vérifie si l'initialisation a déjà été faite
    if (isCountryInputInitialized) return;
    isCountryInputInitialized = true;

    const countryInput = document.querySelector("#welcomepage-country");
    const countryList = document.querySelector("#country-list");

    if (!countryInput || !countryList) return;

    let currentLanguage = document.documentElement.lang || 'fr';
    let countries = [];
    let filteredCountries = [];

    async function loadCountries(lang) {
        try {            
            if (!countriesCache[lang]) {
                const response = await api.get(`/data/countries_${lang}.json`);
                countriesCache[lang] = response;
            }
            countries = countriesCache[lang];
            filteredCountries = [...countries];
            displayCountries(countries);
        } catch (error) {
            console.error('Erreur de chargement des pays:', error);
            countries = [];
            filteredCountries = [];
            displayCountries([]);
        }
    }

    function displayCountries(countriesList) {
        countryList.innerHTML = "";
        
        if (countriesList.length === 0) {
            const noResult = document.createElement("div");
            noResult.textContent = currentLanguage === "fr" ? "Aucun pays trouvé" : "No country found";
            noResult.classList.add("country-item");
            countryList.appendChild(noResult);
            notificationService.show('auth.country.notfound', 'warning');
            return;
        }

        countriesList.forEach((country) => {
            const countryItem = document.createElement("div");
            countryItem.textContent = country.name;
            countryItem.classList.add("country-item");
            countryItem.setAttribute("data-code", country.code);
            countryItem.setAttribute("role", "option");
            
            countryItem.addEventListener("click", () => {
                countryInput.value = country.name;
                countryList.style.display = "none";
            });

            countryList.appendChild(countryItem);
        });
    }

    countryInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length > 0) {
            filteredCountries = countries.filter(country => 
                country.name.toLowerCase().includes(query)
            );
            displayCountries(filteredCountries);
            countryList.style.display = "block";
        } else {
            countryList.style.display = "none";
        }
    });

    countryInput.addEventListener("focus", () => {
        if (countries.length > 0) {
            displayCountries(countries);
            countryList.style.display = "block";
        }
    });

    document.addEventListener("click", (e) => {
        if (!countryInput.contains(e.target) && !countryList.contains(e.target)) {
            countryList.style.display = "none";
        }
    });

    document.addEventListener('languageChanged', (event) => {
        currentLanguage = event.detail.language;
        loadCountries(currentLanguage);
    });

    loadCountries(currentLanguage);
}

// Export des fonctions principales
export { initializeAuth, handleSignup };
export default {
    initializeAuth,
    handleSignup
};
