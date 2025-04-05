// topnav.js
import { navigateTo } from "../../utils/utils.js";
import { api } from "../../services/api/dynamicLoader.js";
import { authService } from "../../services/auth/authService.js";

// Variable pour stocker les références aux gestionnaires d'événements
const eventListeners = {
  profileButton: null,
  usernameDisplay: null,
  document: null,
  navLinks: [],
  hamburger: null,
  themeToggle: null,
  logoutBtn: null,
  keydown: null,
  login: null, // Ajout d'un écouteur pour l'événement login
};

// Fonction pour nettoyer les anciens écouteurs d'événements
function cleanupEventListeners() {
  // Supprimer les écouteurs d'événements précédents
  if (eventListeners.profileButton) {
    const profileButton = document.getElementById("profile-button");
    if (profileButton) {
      profileButton.removeEventListener("click", eventListeners.profileButton);
    }
  }

  // Supprimer l'écouteur d'événement pour username-display
  if (eventListeners.usernameDisplay) {
    const usernameDisplay =
      document.getElementById("username-display") ||
      document.getElementById("usernameDisplay");
    if (usernameDisplay) {
      usernameDisplay.removeEventListener(
        "click",
        eventListeners.usernameDisplay
      );
    }
  }

  if (eventListeners.document) {
    document.removeEventListener("click", eventListeners.document);
  }

  if (eventListeners.navLinks.length > 0) {
    document.querySelectorAll("[data-destination]").forEach((link, index) => {
      if (eventListeners.navLinks[index]) {
        link.removeEventListener("click", eventListeners.navLinks[index]);
      }
    });
    eventListeners.navLinks = [];
  }

  if (eventListeners.hamburger) {
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    if (hamburgerBtn) {
      hamburgerBtn.removeEventListener("click", eventListeners.hamburger);
    }
  }

  if (eventListeners.themeToggle) {
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.removeEventListener("change", eventListeners.themeToggle);
    }
  }

  if (eventListeners.logoutBtn) {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.removeEventListener("click", eventListeners.logoutBtn);
    }
  }

  if (eventListeners.keydown) {
    document.removeEventListener("keydown", eventListeners.keydown);
  }

  // Nettoyer l'écouteur d'événement login
  if (eventListeners.login) {
    window.removeEventListener("login", eventListeners.login);
  }

  console.log("Nettoyage des écouteurs d'événements de topnav effectué");
}

export async function initializeTopNav() {
  // Ne pas initialiser sur la page d'accueil pour utilisateurs non connectés
  const isWelcomePage = window.location.pathname.includes("welcomepage");
  const hasToken = !!localStorage.getItem("token");

  if (isWelcomePage && !hasToken) {
    console.log("Initialisation de topnav ignorée sur welcomepage");
    return; // Sortie anticipée - aucune initialisation
  }

  // Nettoyer les anciens écouteurs d'événements pour éviter les doublons
  cleanupEventListeners();

  // Éléments du DOM
  const profileDropdown = document.getElementById("profile-dropdown");
  const profileButton = document.getElementById("profile-button");
  const usernameDisplay =
    document.getElementById("username-display") ||
    document.getElementById("usernameDisplay");
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const themeToggle = document.getElementById("theme-toggle");
  const logoutBtn = document.getElementById("logoutBtn");

  // Fonction pour mettre à jour le nom d'utilisateur
  async function updateUsername() {
    try {
      console.log("Tentative de mise à jour du nom d'utilisateur");
      const user = await authService.getProfile();

      // Vérifions les deux ID possibles pour plus de robustesse
      const usernameDisplay =
        document.getElementById("username-display") ||
        document.getElementById("usernameDisplay");

      if (usernameDisplay && user && user.username) {
        console.log("Mise à jour du nom d'utilisateur:", user.username);
        usernameDisplay.textContent = user.username;
      } else {
        console.warn("Éléments manquants pour la mise à jour du nom:", {
          usernameDisplay: !!usernameDisplay,
          user: !!user,
          username: user?.username,
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement du pseudo:", error);
    }
  }

  // Mettre à jour le nom d'utilisateur initialement si l'utilisateur est connecté
  if (authService.isAuthenticated()) {
    await updateUsername();
  }

  // Rétablir l'écouteur d'événement login
  eventListeners.login = async () => {
    console.log("Événement login détecté, mise à jour du pseudo");
    await updateUsername();
  };
  window.addEventListener("login", eventListeners.login);

  // Toggle dropdown du profil
  if (profileButton) {
    eventListeners.profileButton = (e) => {
      e.stopPropagation();
      profileDropdown?.classList.toggle("show");
    };
    profileButton.addEventListener("click", eventListeners.profileButton);
  }

  // Ajouter un écouteur d'événement pour username-display
  if (usernameDisplay) {
    eventListeners.usernameDisplay = (e) => {
      e.stopPropagation();
      profileDropdown?.classList.toggle("show");
    };
    usernameDisplay.addEventListener("click", eventListeners.usernameDisplay);
    // Ajouter un style de curseur pour indiquer que l'élément est cliquable
    usernameDisplay.style.cursor = "pointer";
  }

  // Fermer le dropdown si clic extérieur
  eventListeners.document = (e) => {
    if (!profileButton?.contains(e.target)) {
      profileDropdown?.classList.remove("show");
    }
  };
  document.addEventListener("click", eventListeners.document);

  // Gestionnaire de navigation pour les liens du dropdown
  const navigationLinks = document.querySelectorAll("[data-destination]");
  navigationLinks.forEach((link, index) => {
    const listener = async (e) => {
      e.preventDefault();
      const destination = e.currentTarget.getAttribute("data-destination");
      if (destination) {
        // Fermer le dropdown après la navigation
        profileDropdown?.classList.remove("show");
        await navigateTo(destination);
      }
    };
    eventListeners.navLinks.push(listener);
    link.addEventListener("click", listener);
  });

  // Toggle du menu hamburger
  if (hamburgerBtn) {
    const sideNav = document.getElementById("nav");
    eventListeners.hamburger = () => {
      sideNav?.classList.toggle("nav-open");
    };
    hamburgerBtn.addEventListener("click", eventListeners.hamburger);
  }

  // Gestionnaire du thème
  if (themeToggle) {
    // Charger le thème initial
    const currentTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", currentTheme);
    themeToggle.checked = currentTheme === "dark";

    eventListeners.themeToggle = () => {
      const newTheme = themeToggle.checked ? "dark" : "light";
      document.body.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    };
    themeToggle.addEventListener("change", eventListeners.themeToggle);
  }

  // Gestionnaire de déconnexion
  if (logoutBtn) {
    eventListeners.logoutBtn = async (e) => {
      e.preventDefault();
      try {
        await authService.logout();
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("logout"));
        await navigateTo("welcomepage");
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
      }
    };
    logoutBtn.addEventListener("click", eventListeners.logoutBtn);
  }

  // Gestionnaire des raccourcis clavier
  eventListeners.keydown = (e) => {
    // Fermer le dropdown avec Escape
    if (e.key === "Escape" && profileDropdown?.classList.contains("show")) {
      profileDropdown.classList.remove("show");
    }
  };
  document.addEventListener("keydown", eventListeners.keydown);

  console.log("Initialisation de topnav terminée avec succès");
}

// S'assurer que les écouteurs d'événements sont nettoyés quand on navigue vers une autre page
window.addEventListener("navigate", () => {
  const isWelcomePage = window.location.pathname.includes("welcomepage");
  const hasToken = !!localStorage.getItem("token");

  if (isWelcomePage && !hasToken) {
    cleanupEventListeners();
  }
});
