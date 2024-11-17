// auth.js

import { switchTab, initializeTabToggle, navigateTo } from "./utils.js";
import { BotTracker } from "./bot-tracker.js";
import CaptchaHandler from './captcha.js';

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

    // Vérifier d'abord le CAPTCHA
    const isCaptchaValid = await captchaHandler.verify();
    if (!isCaptchaValid) {
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

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Erreur lors de l'inscription");
        }

        const data = await response.json();
        localStorage.setItem("token", data.token);
        alert("Inscription réussie!");
        navigateTo("dashboard");
    } catch (error) {
        console.error("Erreur:", error);
        alert(error.message);
    }

    botTracker.reset();
}

async function handleSignin(event) {
    event.preventDefault();
    console.log("Signin form submitted");
    const email = document.getElementById("welcomepage-signin-email").value;
    const password = document.getElementById("welcomepage-signin-password").value;

    try {
        const response = await fetch(`/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Email ou mot de passe incorrect");
        }

        const data = await response.json();
        localStorage.setItem("token", data.token);
        console.log("Connexion réussie, redirection vers le tableau de bord");
        alert("Connexion réussie! Redirection vers le tableau de bord...");
        setTimeout(() => navigateTo("dashboard"), 1000);
    } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur lors de la connexion : " + error.message);
    }
}

function initializeCountryInput() {
    const countryInput = document.getElementById("welcomepage-country");
    const countryList = document.getElementById("country-list");
    const languageButtons = document.querySelectorAll(".lang-btn");
    let currentLanguage = "fr";
    let countries = [];
    let filteredCountries = [];
    const countryCache = {};

    loadCountries(currentLanguage);

    languageButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const selectedLanguage = button.getAttribute("data-lang");
            if (currentLanguage !== selectedLanguage) {
                currentLanguage = selectedLanguage;
                loadCountries(currentLanguage);
                countryInput.value = "";
                countryList.style.display = "none";
            }
        });
    });

    async function loadCountries(lang) {
        if (countryCache[lang]) {
            countries = countryCache[lang];
            filteredCountries = countries;
            displayCountries(filteredCountries);
            return;
        }
        try {
            const response = await fetch(`api/data/countries_${lang}.json`);
            if (!response.ok) {
                throw new Error("Erreur lors du chargement des pays");
            }
            const data = await response.json();
            countryCache[lang] = data;
            countries = data;
            filteredCountries = countries;
            displayCountries(filteredCountries);
        } catch (error) {
            console.error(error);
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
            countryList.appendChild(countryItem);

            countryItem.addEventListener("click", () => {
                countryInput.value = country.name;
                countryList.style.display = "none";
            });
        });
    }

    function filterCountries(query) {
        const lowerQuery = query.toLowerCase();
        filteredCountries = countries.filter((country) =>
            country.name.toLowerCase().includes(lowerQuery)
        );
        displayCountries(filteredCountries);
    }

    countryInput.addEventListener("input", (e) => {
        const query = e.target.value;
        if (query.length > 0) {
            filterCountries(query);
            countryList.style.display = "block";
        } else {
            filteredCountries = countries;
            displayCountries(filteredCountries);
            countryList.style.display = "none";
        }
    });

    countryInput.addEventListener("focus", () => {
        if (filteredCountries.length > 0) {
            countryList.style.display = "block";
        }
    });

    countryInput.addEventListener("blur", () => {
        setTimeout(() => {
            countryList.style.display = "none";
        }, 200);
    });
}

async function generateBrowserFingerprint() {
    const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: Date.now(),
    };

    return btoa(JSON.stringify(fingerprint));
}

export { initializeAuth, handleSignup };