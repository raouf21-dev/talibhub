// dashboard.js - Gestionnaire pour les éléments intégrés du dashboard
import { navigateTo } from "../../utils/utils.js";
import { authService } from "../../services/auth/authService.js";

// Variable pour stocker les références aux gestionnaires d'événements
const dashboardEventListeners = {
  profileButton: null,
  usernameDisplay: null,
  document: null,
  navLinks: [],
  themeToggle: null,
  logoutBtn: null,
  login: null,
  profileUpdated: null,
  messagingButton: null,
};

function cleanupDashboardEventListeners() {
  if (dashboardEventListeners.profileButton) {
    const dashboardProfileButton = document.getElementById(
      "dashboard-profile-button"
    );
    if (dashboardProfileButton) {
      dashboardProfileButton.removeEventListener(
        "click",
        dashboardEventListeners.profileButton
      );
    }
  }

  if (dashboardEventListeners.usernameDisplay) {
    const dashboardUsernameDisplay = document.getElementById(
      "dashboard-username-display"
    );
    if (dashboardUsernameDisplay) {
      dashboardUsernameDisplay.removeEventListener(
        "click",
        dashboardEventListeners.usernameDisplay
      );
    }
  }

  if (dashboardEventListeners.document) {
    document.removeEventListener("click", dashboardEventListeners.document);
  }

  if (dashboardEventListeners.navLinks.length > 0) {
    document
      .querySelectorAll("#dashboard-profile-dropdown [data-destination]")
      .forEach((link, index) => {
        if (dashboardEventListeners.navLinks[index]) {
          link.removeEventListener(
            "click",
            dashboardEventListeners.navLinks[index]
          );
        }
      });
    dashboardEventListeners.navLinks = [];
  }

  if (dashboardEventListeners.themeToggle) {
    const dashboardThemeToggle = document.getElementById(
      "dashboard-theme-toggle"
    );
    if (dashboardThemeToggle) {
      dashboardThemeToggle.removeEventListener(
        "change",
        dashboardEventListeners.themeToggle
      );
    }
  }

  if (dashboardEventListeners.logoutBtn) {
    const dashboardLogoutBtn = document.getElementById("dashboard-logoutBtn");
    if (dashboardLogoutBtn) {
      dashboardLogoutBtn.removeEventListener(
        "click",
        dashboardEventListeners.logoutBtn
      );
    }
  }

  if (dashboardEventListeners.messagingButton) {
    const dashboardMessagingButton = document.getElementById(
      "dashboardMessagingButton"
    );
    if (dashboardMessagingButton) {
      dashboardMessagingButton.removeEventListener(
        "click",
        dashboardEventListeners.messagingButton
      );
    }
  }

  if (dashboardEventListeners.login) {
    window.removeEventListener("login", dashboardEventListeners.login);
  }

  if (dashboardEventListeners.profileUpdated) {
    window.removeEventListener(
      "profileUpdated",
      dashboardEventListeners.profileUpdated
    );
  }
}

// Fonction pour mettre à jour le nom d'utilisateur dans le dashboard
async function updateDashboardUsername() {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!authService.isAuthenticated()) {
      const dashboardUsernameDisplay = document.getElementById(
        "dashboard-username-display"
      );
      if (dashboardUsernameDisplay) {
        dashboardUsernameDisplay.textContent = "Chargement...";
      }
      return;
    }

    const user = await authService.getProfile();
    const dashboardUsernameDisplay = document.getElementById(
      "dashboard-username-display"
    );

    if (dashboardUsernameDisplay && user) {
      let displayName;

      // Priorité 1: Username/pseudo s'il est renseigné et n'est pas temporaire
      if (
        user.username &&
        user.username.trim() &&
        !(user.username.includes("_") && /\d{10,}/.test(user.username))
      ) {
        displayName = user.username;
      }
      // Priorité 2: Prénom si pas de username valide
      else if (user.firstName && user.firstName.trim()) {
        displayName = user.firstName;
      }
      // Fallback: email ou "Utilisateur"
      else {
        displayName = user.email?.split("@")[0] || "Utilisateur";
      }

      dashboardUsernameDisplay.textContent = displayName;
    } else {
      // Afficher un nom par défaut
      const dashboardUsernameDisplay = document.getElementById(
        "dashboard-username-display"
      );
      if (dashboardUsernameDisplay) {
        dashboardUsernameDisplay.textContent = "Utilisateur";
      }
    }
  } catch (error) {
    // Erreur lors de la mise à jour du nom dashboard
    const dashboardUsernameDisplay = document.getElementById(
      "dashboard-username-display"
    );
    if (dashboardUsernameDisplay) {
      dashboardUsernameDisplay.textContent = "Utilisateur";
    }
  }
}

// Fonction principale d'initialisation du dashboard
export async function initializeDashboard() {
  // Nettoyer les anciens écouteurs d'événements
  cleanupDashboardEventListeners();

  // Ne initialiser que si on est sur une page authentifiée
  if (!authService.isAuthenticated()) {
    return;
  }

  // Éléments du DOM spécifiques au dashboard
  const dashboardProfileDropdown = document.getElementById(
    "dashboard-profile-dropdown"
  );
  const dashboardProfileButton = document.getElementById(
    "dashboard-profile-button"
  );
  const dashboardUsernameDisplay = document.getElementById(
    "dashboard-username-display"
  );
  const dashboardThemeToggle = document.getElementById(
    "dashboard-theme-toggle"
  );
  const dashboardLogoutBtn = document.getElementById("dashboard-logoutBtn");
  const dashboardMessagingButton = document.getElementById(
    "dashboardMessagingButton"
  );

  // Mettre à jour le nom d'utilisateur initialement
  await updateDashboardUsername();

  // Écouteurs d'événements pour les mises à jour
  dashboardEventListeners.login = async () => {
    await updateDashboardUsername();
  };
  window.addEventListener("login", dashboardEventListeners.login);

  dashboardEventListeners.profileUpdated = async () => {
    await updateDashboardUsername();
  };
  window.addEventListener(
    "profileUpdated",
    dashboardEventListeners.profileUpdated
  );

  // === GESTION DU MESSAGING ===
  if (dashboardMessagingButton) {
    dashboardEventListeners.messagingButton = async (e) => {
      e.preventDefault();
      const destination = e.currentTarget.getAttribute("data-destination");
      if (destination) {
        await navigateTo(destination);
      }
    };
    dashboardMessagingButton.addEventListener(
      "click",
      dashboardEventListeners.messagingButton
    );
  }

  // === GESTION DU PROFILE ===
  // Toggle dropdown du profil dashboard
  if (dashboardProfileButton) {
    dashboardEventListeners.profileButton = (e) => {
      e.stopPropagation();
      dashboardProfileDropdown?.classList.toggle("show");
    };
    dashboardProfileButton.addEventListener(
      "click",
      dashboardEventListeners.profileButton
    );
  }

  // Ajouter un écouteur d'événement pour dashboard-username-display
  if (dashboardUsernameDisplay) {
    dashboardEventListeners.usernameDisplay = (e) => {
      e.stopPropagation();
      dashboardProfileDropdown?.classList.toggle("show");
    };
    dashboardUsernameDisplay.addEventListener(
      "click",
      dashboardEventListeners.usernameDisplay
    );
    // Ajouter un style de curseur pour indiquer que l'élément est cliquable
    dashboardUsernameDisplay.style.cursor = "pointer";
  }

  // Fermer le dropdown si clic extérieur
  dashboardEventListeners.document = (e) => {
    if (!dashboardProfileButton?.contains(e.target)) {
      dashboardProfileDropdown?.classList.remove("show");
    }
  };
  document.addEventListener("click", dashboardEventListeners.document);

  // Gestionnaire de navigation pour les liens du dropdown dashboard
  const dashboardNavigationLinks = document.querySelectorAll(
    "#dashboard-profile-dropdown [data-destination]"
  );
  dashboardNavigationLinks.forEach((link, index) => {
    const listener = async (e) => {
      e.preventDefault();
      const destination = e.currentTarget.getAttribute("data-destination");
      if (destination) {
        // Fermer le dropdown après la navigation
        dashboardProfileDropdown?.classList.remove("show");
        await navigateTo(destination);
      }
    };
    dashboardEventListeners.navLinks.push(listener);
    link.addEventListener("click", listener);
  });

  // === GESTION DU THÈME ===
  if (dashboardThemeToggle) {
    // Charger le thème initial
    const currentTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", currentTheme);
    dashboardThemeToggle.checked = currentTheme === "dark";

    dashboardEventListeners.themeToggle = () => {
      const newTheme = dashboardThemeToggle.checked ? "dark" : "light";
      document.body.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    };
    dashboardThemeToggle.addEventListener(
      "change",
      dashboardEventListeners.themeToggle
    );
  }

  // === GESTION DU LOGOUT ===
  if (dashboardLogoutBtn) {
    dashboardEventListeners.logoutBtn = async (e) => {
      e.preventDefault();

      // Masquer immédiatement la sidebar et changer les classes
      const sidebar =
        document.getElementById("nav") || document.querySelector(".sidebar");
      const body = document.body;

      if (sidebar) {
        sidebar.classList.remove("active");
      }

      // Marquer le body comme en cours de déconnexion
      body.classList.add("logging-out");
      body.classList.remove("authenticated");

      try {
        await authService.logout();
        await navigateTo("welcomepage");
      } catch (error) {
        // Erreur lors de la déconnexion
        // Même en cas d'erreur, rediriger vers welcomepage
        await navigateTo("welcomepage");
      }
    };
    dashboardLogoutBtn.addEventListener(
      "click",
      dashboardEventListeners.logoutBtn
    );
  }
}

// Fonction pour nettoyer lors de la navigation vers d'autres pages
export function cleanupDashboard() {
  cleanupDashboardEventListeners();
}
