// main.js
import { initializeAuth } from "./auth.js";
import { initializeNavigation } from "./navigation.js";
import { initializeUtils, navigateTo, updateNavVisibility } from "./utils.js";
import { initializeDashboard } from "./dashboard.js";
import { initializeSurahSelector } from "./surahSelector.js";
import { initializeMosqueTime } from "./mosqueTime.js";
import { initSurahMemorization } from "./surahMemorization.js";
import { langConfig } from './Config/apiConfig.js';
import { initializeTimer } from './timer.js';
import { initializeTopNav } from "./topnav.js";
import { initializeStatistics, cleanupStatistics } from "./statistics.js";

async function checkAuthStatus() {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
        const response = await fetch("/api/auth/verify", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            localStorage.removeItem("token");
            return null;
        }

        return token;
    } catch (error) {
        console.error("Erreur de vérification du token:", error);
        localStorage.removeItem("token");
        return null;
    }
}

function initializeAuthenticatedModules(token) {
    if (!token) {
        console.error("Tentative d'initialisation des modules authentifiés sans token");
        return;
    }

    console.log("Initialisation des modules authentifiés");
    initializeDashboard();
    initializeSurahSelector();
    initializeMosqueTime();
    initSurahMemorization();
    initializeTimer();
    initializeStatistics(); // Ajout de l'initialisation des statistiques
}

async function initializeApp() {
    console.log("Initialisation de l'application");

    const userLang = navigator.language.split('-')[0];
    const lang = langConfig.SUPPORTED_LANGS.includes(userLang) ? userLang : langConfig.DEFAULT_LANG;
    document.documentElement.lang = lang;

    initializeUtils();
    initializeNavigation();
    initializeTopNav();

    const activePageId = document.querySelector(".page.active")?.id || "welcomepage";
    updateNavVisibility(activePageId);

    const token = await checkAuthStatus();

    if (token) {
        console.log("Utilisateur authentifié");
        initializeAuthenticatedModules(token);

        if (activePageId === "welcomepage") {
            navigateTo("dashboard");
        } else {
            navigateTo(activePageId);
        }
    } else {
        console.log("Utilisateur non authentifié");
        navigateTo("welcomepage");
        await initializeAuth();
    }

    window.addEventListener("logout", () => {
        localStorage.removeItem("token");
        navigateTo("welcomepage");
        cleanupStatistics(); // Ajout du nettoyage des statistiques lors de la déconnexion
    });
}

document.addEventListener("DOMContentLoaded", initializeApp);

window.addEventListener("error", (event) => {
    console.error("Erreur globale:", event.error);
});

export { initializeApp };