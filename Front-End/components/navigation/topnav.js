// topnav.js
import { navigateTo } from "../../utils/utils.js";
import { authService } from "../../services/auth/authService.js";

// Variable pour stocker les références aux gestionnaires d'événements
const eventListeners = {
  profileButton: null,
  usernameDisplay: null,
  document: null,
  navLinks: [],
  themeToggle: null,
  logoutBtn: null,
  keydown: null,
  login: null,
  profileUpdated: null,
};

function cleanupEventListeners() {
  console.log("🧹 Nettoyage des écouteurs d'événements topnav");

  if (eventListeners.profileButton) {
    const profileButton = document.getElementById("profile-button");
    if (profileButton) {
      profileButton.removeEventListener("click", eventListeners.profileButton);
    }
  }

  if (eventListeners.usernameDisplay) {
    const usernameDisplay = document.getElementById("username-display");
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
    document
      .querySelectorAll("#profile-dropdown [data-destination]")
      .forEach((link, index) => {
        if (eventListeners.navLinks[index]) {
          link.removeEventListener("click", eventListeners.navLinks[index]);
        }
      });
    eventListeners.navLinks = [];
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

  if (eventListeners.login) {
    window.removeEventListener("login", eventListeners.login);
  }

  if (eventListeners.profileUpdated) {
    window.removeEventListener("profileUpdated", eventListeners.profileUpdated);
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

  // Éléments du DOM de la top-nav classique (non dashboard)
  const profileDropdown = document.getElementById("profile-dropdown");
  const profileButton = document.getElementById("profile-button");
  const usernameDisplay = document.getElementById("username-display");
  const themeToggle = document.getElementById("theme-toggle");
  const logoutBtn = document.getElementById("logoutBtn");

  console.log("🔍 Éléments top-nav trouvés:", {
    profileDropdown: !!profileDropdown,
    profileButton: !!profileButton,
    usernameDisplay: !!usernameDisplay,
    themeToggle: !!themeToggle,
    logoutBtn: !!logoutBtn,
  });

  // Fonction pour mettre à jour le nom d'utilisateur
  async function updateUsername() {
    try {
      console.log("Tentative de mise à jour du nom d'utilisateur");
      const user = await authService.getProfile();

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
  const navigationLinks = document.querySelectorAll(
    "#profile-dropdown [data-destination]"
  );
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

      console.log("🚪 Début du processus de logout depuis topnav");

      // Masquer immédiatement la sidebar et changer les classes
      const sidebar =
        document.getElementById("nav") || document.querySelector(".sidebar");
      const body = document.body;

      if (sidebar) {
        sidebar.classList.remove("active");
        console.log("✅ Sidebar masquée immédiatement lors du logout");
      }

      // Marquer le body comme en cours de déconnexion
      body.classList.add("logging-out");
      body.classList.remove("authenticated");

      try {
        await authService.logout();
        console.log("✅ Déconnexion réussie");
        await navigateTo("welcomepage");
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
        // Même en cas d'erreur, rediriger vers welcomepage
        await navigateTo("welcomepage");
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

  console.log("✅ Initialisation de topnav terminée avec succès");
}
