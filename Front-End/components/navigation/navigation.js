import { navigateTo } from "../../utils/utils.js";

function initializeNavigation() {
  const sidebar = document.getElementById("sidebar");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
  const overlay = document.getElementById("sidebarOverlay");
  const navLinks = document.querySelectorAll(".nav-list a");
  const body = document.body;

  if (!sidebar || !overlay) {
    console.warn("Éléments sidebar non trouvés");
    return;
  }

  // Créer l'encoche hamburger s'il n'existe pas déjà
  let hamburgerBtn = document.getElementById("hamburgerBtn");
  if (!hamburgerBtn) {
    hamburgerBtn = document.createElement("button");
    hamburgerBtn.id = "hamburgerBtn";
    hamburgerBtn.className = "hamburger-btn";
    hamburgerBtn.innerHTML = "MENU";
    hamburgerBtn.setAttribute("aria-label", "Open menu");
    hamburgerBtn.setAttribute("aria-expanded", "false");
    document.body.appendChild(hamburgerBtn);
  }

  // Fonction pour gérer la visibilité du bouton hamburger
  function updateHamburgerVisibility() {
    const welcomePage = document.getElementById("welcomepage");
    const isWelcomePage =
      welcomePage && welcomePage.classList.contains("active");
    const isNarrowScreen = window.innerWidth <= 1024;
    const isAuthenticated = document.body.classList.contains("authenticated");

    // Afficher le hamburger seulement sur mobile ET pages authentifiées (pas welcomepage)
    if (isNarrowScreen && isAuthenticated && !isWelcomePage) {
      hamburgerBtn.style.display = "block";
    } else {
      hamburgerBtn.style.display = "none";
    }
  }

  // Observer les changements de page
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        updateHamburgerVisibility();
      }
    });
  });

  // Observer les changements de classe sur toutes les sections
  document.querySelectorAll(".page").forEach((page) => {
    observer.observe(page, { attributes: true });
  });

  // Observer les changements de classe sur le body pour l'authentification
  observer.observe(document.body, { attributes: true });

  // Gérer les changements de taille de fenêtre
  window.addEventListener("resize", updateHamburgerVisibility);

  // Vérifier la visibilité initiale
  updateHamburgerVisibility();

  function openSidebar() {
    sidebar.classList.add("active");
    overlay.classList.add("active");
    body.classList.add("menu-open");
    // Masquer le hamburger quand la sidebar s'ouvre
    if (hamburgerBtn) {
      hamburgerBtn.style.opacity = "0";
      hamburgerBtn.style.visibility = "hidden";
      hamburgerBtn.style.pointerEvents = "none";
    }
    setTimeout(() => {
      overlay.style.opacity = "1";
    }, 10);
  }

  function closeSidebar() {
    sidebar.classList.remove("active");
    body.classList.remove("menu-open");
    overlay.style.opacity = "0";
    // Réafficher le hamburger quand la sidebar se ferme
    if (hamburgerBtn) {
      hamburgerBtn.style.opacity = "1";
      hamburgerBtn.style.visibility = "visible";
      hamburgerBtn.style.pointerEvents = "auto";
    }
    setTimeout(() => {
      overlay.classList.remove("active");
    }, 300);
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", openSidebar);
  }
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener("click", closeSidebar);
  }
  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const destination = this.getAttribute("data-destination");
      if (destination) {
        navigateTo(destination);
      }
      closeSidebar();
    });
  });

  // Fermer la sidebar sur les grands écrans
  window.addEventListener("resize", function () {
    if (window.innerWidth > 1024) {
      closeSidebar();
    }
    updateHamburgerVisibility();
  });

  setupDashboardCardClicks();
}

function setupDashboardCardClicks() {
  const dashboardCards = document.querySelectorAll(".dashboard-card");

  dashboardCards.forEach((card) => {
    card.addEventListener("click", () => {
      const destination = card.getAttribute("data-destination");
      if (destination) {
        navigateTo(destination);
      } else {
        console.warn("Aucune destination trouvée pour cette carte.");
      }
    });
  });
}

export { initializeNavigation };
