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
    console.log("✅ Encoche menu créée et ajoutée au DOM");
  }

  // 🔍 DIAGNOSTIC : Fonction améliorée pour diagnostiquer le hamburger
  function logHamburgerState(context = "unknown") {
    const computedStyle = window.getComputedStyle(hamburgerBtn);
    const rect = hamburgerBtn.getBoundingClientRect();

    // ⭐ NOUVEAU : Diagnostic détaillé du boundingRect
    const parentElement = hamburgerBtn.parentElement;
    const parentComputedStyle = parentElement
      ? window.getComputedStyle(parentElement)
      : null;

    const diagnosticData = {
      windowWidth: window.innerWidth,
      bodyClasses: document.body.className,
      inlineStyle: hamburgerBtn.style.display || "",
      computedDisplay: computedStyle.display,
      computedVisibility: computedStyle.visibility,
      computedOpacity: computedStyle.opacity,
      computedZIndex: computedStyle.zIndex,
      computedPosition: computedStyle.position,
      boundingRect: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        x: rect.x,
        y: rect.y,
      },
      // ⭐ NOUVEAU : Info sur le parent
      parentInfo: parentElement
        ? {
            tagName: parentElement.tagName,
            className: parentElement.className,
            id: parentElement.id,
            display: parentComputedStyle.display,
            visibility: parentComputedStyle.visibility,
            opacity: parentComputedStyle.opacity,
            overflow: parentComputedStyle.overflow,
            position: parentComputedStyle.position,
          }
        : "no parent",
      // ⭐ NOUVEAU : Calcul détaillé de visibilité
      visibilityFactors: {
        hasPositiveWidth: rect.width > 0,
        hasPositiveHeight: rect.height > 0,
        isInViewport:
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          rect.left < window.innerWidth &&
          rect.right > 0,
        computedDisplayOk: computedStyle.display !== "none",
        computedVisibilityOk: computedStyle.visibility !== "hidden",
        computedOpacityOk: parseFloat(computedStyle.opacity) > 0,
      },
      isVisible:
        rect.width > 0 &&
        rect.height > 0 &&
        computedStyle.display !== "none" &&
        computedStyle.visibility !== "hidden" &&
        parseFloat(computedStyle.opacity) > 0,
      currentPage: document.querySelector(".page.active")?.id || "unknown",
    };

    console.log(`🍔 [${context}] ÉTAT HAMBURGER:`, diagnosticData);

    // ⭐ NOUVEAU : Si pas visible, diagnostic spécifique
    if (!diagnosticData.isVisible) {
      console.log("❌ HAMBURGER PAS VISIBLE - Analyse des causes:");
      if (diagnosticData.boundingRect.width === 0)
        console.log("  • Largeur = 0");
      if (diagnosticData.boundingRect.height === 0)
        console.log("  • Hauteur = 0");
      if (diagnosticData.computedDisplay === "none")
        console.log("  • display: none");
      if (diagnosticData.computedVisibility === "hidden")
        console.log("  • visibility: hidden");
      if (parseFloat(diagnosticData.computedOpacity) === 0)
        console.log("  • opacity: 0");

      // Vérifier la hiérarchie des parents
      let currentElement = hamburgerBtn.parentElement;
      let level = 1;
      while (currentElement && level <= 3) {
        const currentStyle = window.getComputedStyle(currentElement);
        if (
          currentStyle.display === "none" ||
          currentStyle.visibility === "hidden" ||
          parseFloat(currentStyle.opacity) === 0
        ) {
          console.log(
            `  • Parent niveau ${level} (${currentElement.tagName}.${currentElement.className}) masque l'élément:`,
            {
              display: currentStyle.display,
              visibility: currentStyle.visibility,
              opacity: currentStyle.opacity,
            }
          );
        }
        currentElement = currentElement.parentElement;
        level++;
      }
    }

    return diagnosticData;
  }

  // Fonction pour gérer la visibilité du bouton hamburger
  function updateHamburgerVisibility() {
    const welcomePage = document.getElementById("welcomepage");
    const isWelcomePage =
      welcomePage && welcomePage.classList.contains("active");
    const isNarrowScreen = window.innerWidth <= 1024;
    const isAuthenticated = document.body.classList.contains("authenticated");

    console.log(`🔄 updateHamburgerVisibility appelée:`, {
      isWelcomePage,
      isNarrowScreen,
      isAuthenticated,
      windowWidth: window.innerWidth,
      bodyClasses: document.body.className,
    });

    // Afficher le hamburger seulement sur mobile ET pages authentifiées (pas welcomepage)
    if (isNarrowScreen && isAuthenticated && !isWelcomePage) {
      console.log(
        "✅ Mobile + Authentifié + Non-welcomepage - affichage du hamburger"
      );
      hamburgerBtn.style.display = "block";
      // Suppression des styles inline position/top/left/zIndex
      // Ils seront gérés entièrement par CSS
    } else {
      console.log("🚫 Conditions non remplies - masquage du hamburger");
      hamburgerBtn.style.display = "none";
    }

    // Log après modification
    logHamburgerState("after updateHamburgerVisibility");
  }

  // Observer les changements de page
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        console.log(
          "👁️ Changement de classe détecté sur:",
          mutation.target.id || mutation.target.className
        );
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
  window.addEventListener("resize", () => {
    console.log("📏 Redimensionnement de fenêtre détecté");
    updateHamburgerVisibility();
  });

  // Vérifier la visibilité initiale
  console.log("🚀 Initialisation navigation - État initial:");
  logHamburgerState("initialization");
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
    console.log(`📐 Resize détecté: ${window.innerWidth}px`);

    if (window.innerWidth > 1024) {
      console.log("🖥️ Grand écran détecté - fermeture sidebar");
      closeSidebar();
    }

    updateHamburgerVisibility();
  });

  // 🔍 DIAGNOSTIC : Log périodique pour le debug
  setInterval(() => {
    const welcomePage = document.getElementById("welcomepage");
    if (
      window.innerWidth <= 1024 &&
      welcomePage &&
      !welcomePage.classList.contains("active")
    ) {
      logHamburgerState("periodic check (mobile + authenticated)");
    }
  }, 5000);

  setupDashboardCardClicks();
}

function setupDashboardCardClicks() {
  const dashboardCards = document.querySelectorAll(".dashboard-card");
  console.log(`Found ${dashboardCards.length} dashboard cards`);

  dashboardCards.forEach((card) => {
    card.addEventListener("click", () => {
      const destination = card.getAttribute("data-destination");
      console.log(`Clicked on card with destination: ${destination}`);
      if (destination) {
        navigateTo(destination);
      } else {
        console.warn("Aucune destination trouvée pour cette carte.");
      }
    });
  });
}

// DÉPLACÉ VERS DASHBOARD.JS - Plus de gestion logout ici
// L'élément logoutBtn est maintenant géré dans dashboard.js avec l'ID "dashboard-logoutBtn"

export { initializeNavigation };
