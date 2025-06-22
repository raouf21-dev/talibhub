// Script de débogage temporaire pour forcer l'authentification
// À utiliser seulement pour tester le hamburger menu

console.log("🔧 Script de débogage chargé");

// Forcer l'authentification
document.cookie = "auth=true; path=/";

// Ajouter la classe authenticated au body
document.body.classList.add("authenticated");
document.body.classList.remove("on-welcomepage");

// ⭐ NOUVEAU : Fonction avancée pour diagnostiquer le hamburger
window.diagHamburger = function () {
  const hamburger = document.getElementById("hamburgerBtn");

  if (!hamburger) {
    console.log("❌ Hamburger non trouvé");
    return;
  }

  console.log("🔍 === DIAGNOSTIC APPROFONDI HAMBURGER ===");

  // 1. État de base
  const rect = hamburger.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(hamburger);

  console.log("📐 Dimensions et position:", {
    width: rect.width,
    height: rect.height,
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
  });

  console.log("🎨 Styles calculés:", {
    display: computedStyle.display,
    visibility: computedStyle.visibility,
    opacity: computedStyle.opacity,
    position: computedStyle.position,
    zIndex: computedStyle.zIndex,
    overflow: computedStyle.overflow,
  });

  // 2. Analyse de la hiérarchie des parents
  console.log("👪 Hiérarchie des parents:");
  let current = hamburger;
  let level = 0;

  while (current && level < 5) {
    const style = window.getComputedStyle(current);
    const rect = current.getBoundingClientRect();

    console.log(
      `  Niveau ${level}: ${current.tagName}#${current.id}.${current.className}`,
      {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        overflow: style.overflow,
        width: rect.width,
        height: rect.height,
      }
    );

    current = current.parentElement;
    level++;
  }

  // 3. Test de forçage d'affichage
  console.log("🚀 Test de forçage d'affichage...");

  // Sauvegarder les styles originaux
  const originalStyles = {
    display: hamburger.style.display,
    visibility: hamburger.style.visibility,
    opacity: hamburger.style.opacity,
    position: hamburger.style.position,
    zIndex: hamburger.style.zIndex,
  };

  // Forcer l'affichage
  hamburger.style.display = "block !important";
  hamburger.style.visibility = "visible !important";
  hamburger.style.opacity = "1 !important";
  hamburger.style.position = "fixed !important";
  hamburger.style.top = "10px !important";
  hamburger.style.left = "10px !important";
  hamburger.style.zIndex = "9999 !important";
  hamburger.style.backgroundColor = "red !important";
  hamburger.style.width = "50px !important";
  hamburger.style.height = "50px !important";

  const newRect = hamburger.getBoundingClientRect();
  console.log("📐 Nouvelles dimensions après forçage:", {
    width: newRect.width,
    height: newRect.height,
    top: newRect.top,
    left: newRect.left,
  });

  // Restaurer après 3 secondes
  setTimeout(() => {
    Object.entries(originalStyles).forEach(([prop, value]) => {
      if (value) hamburger.style[prop] = value;
      else hamburger.style.removeProperty(prop);
    });
    console.log("🔄 Styles originaux restaurés");
  }, 3000);

  console.log("✅ Diagnostic terminé");
};

// Fonction pour tester le hamburger
window.testHamburger = function () {
  const hamburger = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");

  console.log("🔍 État hamburger:", {
    element: !!hamburger,
    display: hamburger?.style.display,
    visible: hamburger
      ? window.getComputedStyle(hamburger).display
      : "not found",
    auth: document.cookie.includes("auth=true"),
    bodyClasses: document.body.className,
    windowWidth: window.innerWidth,
  });

  if (hamburger) {
    // Forcer l'affichage du hamburger
    hamburger.style.display = "block";
    hamburger.style.visibility = "visible";
    hamburger.style.opacity = "1";
    console.log("✅ Hamburger forcé visible");
  }

  if (sidebar) {
    sidebar.style.display = "none";
    console.log("✅ Sidebar masquée");
  }
};

// 🔍 NOUVEAU : Diagnostic CSS et Media Queries
window.diagnoseCSSRules = function () {
  const hamburger = document.getElementById("hamburgerBtn");
  if (!hamburger) {
    console.error("❌ Hamburger introuvable");
    return;
  }

  console.log("🎨 DIAGNOSTIC CSS HAMBURGER:");

  // Vérifier toutes les règles CSS qui s'appliquent au hamburger
  const computedStyle = window.getComputedStyle(hamburger);
  console.log("📊 Styles calculés:", {
    display: computedStyle.display,
    visibility: computedStyle.visibility,
    opacity: computedStyle.opacity,
    position: computedStyle.position,
    zIndex: computedStyle.zIndex,
  });

  // Tester les media queries manuellement
  const isMobile = window.matchMedia("(max-width: 1024px)").matches;
  const isTablet = window.matchMedia("(max-width: 768px)").matches;
  const isSmallMobile = window.matchMedia("(max-width: 480px)").matches;

  console.log("📱 Media Queries:", {
    windowWidth: window.innerWidth,
    isMobile1024: isMobile,
    isTablet768: isTablet,
    isSmallMobile480: isSmallMobile,
  });

  // Vérifier les classes du body qui peuvent influencer l'affichage
  const bodyClasses = document.body.classList;
  console.log("🏷️ Classes body:", Array.from(bodyClasses));

  // Vérifier si les règles CSS importantes s'appliquent
  const rules = document.styleSheets;
  let foundRules = [];

  try {
    for (let sheet of rules) {
      for (let rule of sheet.cssRules || sheet.rules || []) {
        if (rule.selectorText && rule.selectorText.includes(".hamburger-btn")) {
          foundRules.push({
            selector: rule.selectorText,
            cssText: rule.style.cssText,
            media: rule.parentRule?.media?.mediaText || "all",
          });
        }
      }
    }
    console.log("📋 Règles CSS trouvées pour hamburger:", foundRules);
  } catch (e) {
    console.warn("⚠️ Impossible de lire les règles CSS:", e.message);
  }
};

// Auto-exécution après 2 secondes
setTimeout(() => {
  console.log("🔧 Auto-test hamburger...");
  window.testHamburger();
  window.diagnoseCSSRules();
}, 2000);

console.log("🔧 Pour tester manuellement, tapez: testHamburger()");
