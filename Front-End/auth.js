// auth.js
import { switchTab, initializeTabToggle, navigateTo } from "./utils.js";
import { BotTracker } from "./bot-tracker.js";
import CaptchaHandler from './captcha.js';
import { apiClient } from './Config/apiConfig.js';
import { api } from './dynamicLoader.js';

const botTracker = new BotTracker();
const captchaHandler = new CaptchaHandler();

function initializeAuth() {
    initializeAuthForms();
    initializeTabToggle();
    initializeCountryInput();
}

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

function initializeEmailValidation() {
    const emailInput = document.getElementById("welcomepage-email");
    const confirmEmailInput = document.getElementById("welcomepage-confirmEmail");

    if (!emailInput || !confirmEmailInput) {
        console.error("Les champs email ne sont pas trouvés");
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
            confirmEmailInput.setCustomValidity("Les adresses e-mail ne correspondent pas");
            confirmEmailInput.style.borderColor = "red";
        } else {
            confirmEmailInput.setCustomValidity("");
            confirmEmailInput.style.borderColor = "green";
        }

        confirmEmailInput.reportValidity();
    }

    emailInput.addEventListener("input", validateEmails);
    confirmEmailInput.addEventListener("input", validateEmails);
}

function showAuthForms() {
    console.log("showAuthForms called");
    const authForms = document.getElementById("welcomepage-auth-forms");
    const getStartedBtn = document.getElementById("welcomepage-getStartedBtn");

    if (authForms && getStartedBtn) {
        getStartedBtn.style.display = "none";
        authForms.classList.remove("hidden");
        authForms.style.display = "block";
        document.body.style.overflow = "auto";

        setTimeout(() => {
            authForms.classList.add("visible");
        }, 10);

        switchTab("signin");
    }
}

async function handleSignup(event) {
    event.preventDefault();

    try {
        // Vérification du CAPTCHA
        const isCaptchaValid = await captchaHandler.verify();
        if (!isCaptchaValid) {
            alert("Veuillez valider le captcha");
            return;
        }

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

        // Validation des champs
        if (!formData.username || !formData.email || !formData.password) {
            throw new Error("Veuillez remplir tous les champs obligatoires");
        }

        if (formData.email !== formData.confirmEmail) {
            throw new Error("Les adresses email ne correspondent pas");
        }

        // Utilisation du nouveau service API avec loader
        await api.post('/auth/register', formData);
        alert("Inscription réussie!");
        navigateTo("dashboard");
    } catch (error) {
        console.error("Erreur:", error);
        alert(error.message || "Une erreur est survenue lors de l'inscription");
    }

    botTracker.reset();
}

async function handleSignin(event) {
    event.preventDefault();
    
    try {
        const credentials = {
            email: document.getElementById("welcomepage-signin-email").value,
            password: document.getElementById("welcomepage-signin-password").value
        };

        // Utilisation du nouveau service API avec loader
        const response = await api.post('/auth/login', credentials);
        if (response && response.token) {
            api.updateToken(response.token);
            console.log("Connexion réussie, redirection vers le tableau de bord");
            setTimeout(() => navigateTo("dashboard"), 1000);
        } else {
            throw new Error("Token de connexion non reçu");
        }
    } catch (error) {
        console.error("Erreur détaillée:", error);
        alert("Erreur lors de la connexion : " + error.message);
    }
}

function initializeCountryInput() {
    const countryInput = document.querySelector("#welcomepage-country");
    const countryList = document.querySelector("#country-list");

    if (!countryInput || !countryList) {
        console.error("Les éléments de pays n'ont pas été trouvés");
        return;
    }

    let currentLanguage = document.documentElement.lang || 'fr';
    let countries = [];
    let filteredCountries = [];
    const countryCache = {};

    async function loadCountries(lang) {
        try {
            if (!countryCache[lang]) {
                const response = await api.get(`/data/countries_${lang}.json`);
                countryCache[lang] = response;
            }
            countries = countryCache[lang];
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

export { initializeAuth, handleSignup };