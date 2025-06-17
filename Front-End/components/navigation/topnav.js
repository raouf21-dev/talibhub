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
  login: null,
  profileUpdated: null,
  // Ajout des écouteurs pour les éléments du dashboard
  dashboardLogin: null,
  dashboardProfileUpdated: null,
  dashboardProfileButton: null,
  dashboardUsernameDisplay: null,
  dashboardDocument: null,
  dashboardNavLinks: [],
  dashboardThemeToggle: null,
  dashboardLogoutBtn: null,
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

  // Nettoyer les écouteurs du dashboard
  if (eventListeners.dashboardProfileButton) {
    const dashboardProfileButton = document.getElementById(
      "dashboard-profile-button"
    );
    if (dashboardProfileButton) {
      dashboardProfileButton.removeEventListener(
        "click",
        eventListeners.dashboardProfileButton
      );
    }
  }

  if (eventListeners.dashboardUsernameDisplay) {
    const dashboardUsernameDisplay = document.getElementById(
      "dashboard-username-display"
    );
    if (dashboardUsernameDisplay) {
      dashboardUsernameDisplay.removeEventListener(
        "click",
        eventListeners.dashboardUsernameDisplay
      );
    }
  }

  if (eventListeners.dashboardDocument) {
    document.removeEventListener("click", eventListeners.dashboardDocument);
  }

  if (eventListeners.dashboardNavLinks.length > 0) {
    document
      .querySelectorAll("#dashboard-profile-dropdown [data-destination]")
      .forEach((link, index) => {
        if (eventListeners.dashboardNavLinks[index]) {
          link.removeEventListener(
            "click",
            eventListeners.dashboardNavLinks[index]
          );
        }
      });
    eventListeners.dashboardNavLinks = [];
  }

  if (eventListeners.dashboardThemeToggle) {
    const dashboardThemeToggle = document.getElementById(
      "dashboard-theme-toggle"
    );
    if (dashboardThemeToggle) {
      dashboardThemeToggle.removeEventListener(
        "change",
        eventListeners.dashboardThemeToggle
      );
    }
  }

  if (eventListeners.dashboardLogoutBtn) {
    const dashboardLogoutBtn = document.getElementById("dashboard-logoutBtn");
    if (dashboardLogoutBtn) {
      dashboardLogoutBtn.removeEventListener(
        "click",
        eventListeners.dashboardLogoutBtn
      );
    }
  }

  if (eventListeners.keydown) {
    document.removeEventListener("keydown", eventListeners.keydown);
  }

  if (eventListeners.login) {
    window.removeEventListener("login", eventListeners.login);
  }

  if (eventListeners.profileUpdated) {
    window.removeEventListener("profileUpdated", eventListeners.profileUpdated);
  }

  if (eventListeners.dashboardLogin) {
    window.removeEventListener("login", eventListeners.dashboardLogin);
  }

  if (eventListeners.dashboardProfileUpdated) {
    window.removeEventListener(
      "profileUpdated",
      eventListeners.dashboardProfileUpdated
    );
  }
}

// Fonction pour initialiser les éléments du profil intégrés au dashboard
function initializeDashboardProfile() {
  console.log("🚀 DÉBUT initializeDashboardProfile()");

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

  console.log("🔍 Éléments trouvés:", {
    dashboardProfileDropdown: !!dashboardProfileDropdown,
    dashboardProfileButton: !!dashboardProfileButton,
    dashboardUsernameDisplay: !!dashboardUsernameDisplay,
    dashboardThemeToggle: !!dashboardThemeToggle,
    dashboardLogoutBtn: !!dashboardLogoutBtn,
  });

  // Fonction pour mettre à jour le nom d'utilisateur dans le dashboard
  async function updateDashboardUsername() {
    try {
      console.log("🔄 Mise à jour du nom d'utilisateur dans le dashboard");

      // Vérifier si l'utilisateur est authentifié (token OU cookies OAuth)
      if (!authService.isAuthenticated()) {
        console.log(
          "⏳ Utilisateur non authentifié - attente de l'authentification"
        );
        if (dashboardUsernameDisplay) {
          dashboardUsernameDisplay.textContent = "Chargement...";
        }
        return;
      }

      console.log("🔍 Récupération du profil utilisateur...");
      const user = await authService.getProfile();

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

        console.log(
          "✅ Mise à jour du nom d'utilisateur dashboard:",
          displayName
        );
        dashboardUsernameDisplay.textContent = displayName;
      } else {
        console.warn(
          "Éléments manquants pour la mise à jour du nom dashboard:",
          {
            dashboardUsernameDisplay: !!dashboardUsernameDisplay,
            user: !!user,
            username: user?.username,
          }
        );

        // Afficher un nom par défaut
        if (dashboardUsernameDisplay) {
          dashboardUsernameDisplay.textContent = "Utilisateur";
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement du pseudo dashboard:", error);
      // En cas d'erreur, afficher un nom par défaut
      if (dashboardUsernameDisplay) {
        dashboardUsernameDisplay.textContent = "Utilisateur";
      }
    }
  }

  // Mettre à jour le nom d'utilisateur du dashboard si l'utilisateur est connecté
  const urlParams = new URLSearchParams(window.location.search);
  const isOAuthCallback =
    urlParams.get("auth") === "success" || urlParams.get("auth") === "error";

  if (authService.isAuthenticated()) {
    console.log("🔍 Utilisateur authentifié détecté - mise à jour du username");
    updateDashboardUsername();
  } else if (isOAuthCallback) {
    console.log(
      "⏳ Callback OAuth détecté - attente de l'événement login pour mettre à jour le username"
    );
  }

  // Écouter l'événement login pour mettre à jour le nom du dashboard
  const dashboardLoginListener = () => {
    console.log(
      "🎉 ÉVÉNEMENT LOGIN détecté dans dashboard - déclenchement updateDashboardUsername"
    );
    updateDashboardUsername();
  };
  window.addEventListener("login", dashboardLoginListener);
  console.log("✅ Écouteur login ajouté pour dashboard");

  // Écouter l'événement profileUpdated pour forcer la mise à jour du nom du dashboard
  const dashboardProfileUpdatedListener = () => {
    console.log(
      "🎉 ÉVÉNEMENT PROFILE_UPDATED détecté dans dashboard - déclenchement updateDashboardUsername"
    );
    updateDashboardUsername();
  };
  window.addEventListener("profileUpdated", dashboardProfileUpdatedListener);
  console.log("✅ Écouteur profileUpdated ajouté pour dashboard");

  // Stocker les références pour le nettoyage
  eventListeners.dashboardLogin = dashboardLoginListener;
  eventListeners.dashboardProfileUpdated = dashboardProfileUpdatedListener;

  // Toggle dropdown du profil dashboard
  if (dashboardProfileButton) {
    eventListeners.dashboardProfileButton = (e) => {
      e.stopPropagation();
      dashboardProfileDropdown?.classList.toggle("show");
    };
    dashboardProfileButton.addEventListener(
      "click",
      eventListeners.dashboardProfileButton
    );
  }

  // Ajouter un écouteur d'événement pour dashboard-username-display
  if (dashboardUsernameDisplay) {
    eventListeners.dashboardUsernameDisplay = (e) => {
      e.stopPropagation();
      dashboardProfileDropdown?.classList.toggle("show");
    };
    dashboardUsernameDisplay.addEventListener(
      "click",
      eventListeners.dashboardUsernameDisplay
    );
    // Ajouter un style de curseur pour indiquer que l'élément est cliquable
    dashboardUsernameDisplay.style.cursor = "pointer";
  }

  // Fermer le dropdown si clic extérieur
  eventListeners.dashboardDocument = (e) => {
    if (!dashboardProfileButton?.contains(e.target)) {
      dashboardProfileDropdown?.classList.remove("show");
    }
  };
  document.addEventListener("click", eventListeners.dashboardDocument);

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
    eventListeners.dashboardNavLinks.push(listener);
    link.addEventListener("click", listener);
  });

  // Gestionnaire du thème dashboard
  if (dashboardThemeToggle) {
    // Charger le thème initial
    const currentTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", currentTheme);
    dashboardThemeToggle.checked = currentTheme === "dark";

    eventListeners.dashboardThemeToggle = () => {
      const newTheme = dashboardThemeToggle.checked ? "dark" : "light";
      document.body.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    };
    dashboardThemeToggle.addEventListener(
      "change",
      eventListeners.dashboardThemeToggle
    );
  }

  // Gestionnaire de déconnexion dashboard
  if (dashboardLogoutBtn) {
    eventListeners.dashboardLogoutBtn = async (e) => {
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
    dashboardLogoutBtn.addEventListener(
      "click",
      eventListeners.dashboardLogoutBtn
    );
  }

  console.log("✅ Initialisation du profil dashboard terminée avec succès");
}

// Fonction pour initialiser les boutons home
function initializeHomeButtons() {
  // Gérer tous les boutons home présents sur la page
  const homeButtons = document.querySelectorAll(".home-button");

  homeButtons.forEach((button) => {
    // Supprimer l'ancien écouteur s'il existe
    button.removeEventListener("click", handleHomeButtonClick);
    button.removeEventListener("mouseenter", handleHomeButtonHover);
    button.removeEventListener("mouseleave", handleHomeButtonLeave);

    // Ajouter les nouveaux écouteurs
    button.addEventListener("click", handleHomeButtonClick);
    button.addEventListener("mouseenter", handleHomeButtonHover);
    button.addEventListener("mouseleave", handleHomeButtonLeave);

    // S'assurer que le bouton a le bon curseur
    button.style.cursor = "pointer";
  });

  console.log(`Initialisé ${homeButtons.length} bouton(s) home avec effets`);
}

// Gestionnaire de clic pour les boutons home
async function handleHomeButtonClick(e) {
  e.preventDefault();
  e.stopPropagation();

  const button = e.currentTarget;
  const currentPage =
    document.querySelector(".page.active")?.id || "page inconnue";

  // Effet d'animation de clic
  button.style.transform = "translateY(0px) scale(0.95)";
  button.style.transition = "transform 0.1s ease";

  setTimeout(() => {
    button.style.transform = "";
    button.style.transition = "all 0.2s ease";
  }, 150);

  console.log(`Navigation vers dashboard depuis: ${currentPage}`);

  try {
    await navigateTo("dashboard");
  } catch (error) {
    console.error("Erreur lors de la navigation vers le dashboard:", error);
  }
}

// Gestionnaire de hover pour les boutons home
function handleHomeButtonHover(e) {
  const button = e.currentTarget;
  if (!button.style.transform.includes("scale(0.95)")) {
    button.style.transform = "translateY(-2px) scale(1.05)";
  }
}

// Gestionnaire de leave pour les boutons home
function handleHomeButtonLeave(e) {
  const button = e.currentTarget;
  if (!button.style.transform.includes("scale(0.95)")) {
    button.style.transform = "";
  }
}

export async function initializeTopNav() {
  console.log("🚀 DÉBUT initializeTopNav()");
  console.log("🔍 URL actuelle:", window.location.href);
  console.log("🔍 Pathname:", window.location.pathname);

  // Ne pas initialiser sur la page d'accueil pour utilisateurs non connectés
  const isWelcomePage = window.location.pathname.includes("welcomepage");
  const hasToken = !!localStorage.getItem("token");
  const isAuthenticated = authService.isAuthenticated();

  console.log("🔍 État d'initialisation:", {
    isWelcomePage,
    hasToken,
    isAuthenticated,
  });

  if (isWelcomePage && !hasToken) {
    console.log("⚠️ Initialisation de topnav ignorée sur welcomepage");
    return; // Sortie anticipée - aucune initialisation
  }

  console.log("✅ Conditions remplies - poursuite de l'initialisation");

  // Nettoyer les anciens écouteurs d'événements pour éviter les doublons
  cleanupEventListeners();

  // Initialiser les éléments du profil intégrés au dashboard
  console.log("🔧 Appel initializeDashboardProfile()");
  initializeDashboardProfile();

  // Initialiser les boutons home
  initializeHomeButtons();

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

      if (usernameDisplay && user) {
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

        console.log("Mise à jour du nom d'utilisateur:", displayName);
        usernameDisplay.textContent = displayName;
      } else {
        console.warn("Éléments manquants pour la mise à jour du nom:", {
          usernameDisplay: !!usernameDisplay,
          user: !!user,
          username: user?.username,
          firstName: user?.firstName,
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

  // Rétablir l'écouteur d'événement login pour la navigation classique
  eventListeners.login = async () => {
    console.log(
      "📢 Événement login détecté dans topnav, mise à jour du pseudo"
    );
    await updateUsername();
  };
  window.addEventListener("login", eventListeners.login);

  // Écouteur supplémentaire pour événement profileUpdated
  eventListeners.profileUpdated = async () => {
    console.log("📢 Événement profileUpdated détecté dans topnav");
    await updateUsername();
  };
  window.addEventListener("profileUpdated", eventListeners.profileUpdated);

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
    // Fermer le dropdown dashboard avec Escape
    const dashboardProfileDropdown = document.getElementById(
      "dashboard-profile-dropdown"
    );
    if (
      e.key === "Escape" &&
      dashboardProfileDropdown?.classList.contains("show")
    ) {
      dashboardProfileDropdown.classList.remove("show");
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

// Exporter les fonctions nécessaires
export { initializeDashboardProfile };
