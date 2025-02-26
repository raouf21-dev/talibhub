// transLanguages.js

// Au chargement du DOM, on gère la langue.
document.addEventListener("DOMContentLoaded", () => {
    // 1. Gérer les clics sur les boutons de langue.
    // Ces boutons doivent rediriger vers le fichier HTML dédié (index-fr.html ou index-en.html).
    const langButtons = document.querySelectorAll(".lang-btn");
    langButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();
        const selectedLang = button.getAttribute("data-lang");
        // Enregistrez la préférence dans le localStorage avec la clé "userLang"
        localStorage.setItem("userLang", selectedLang);
        // Rediriger vers le fichier HTML correspondant.
        window.location.href = `index-${selectedLang}.html`;
      });
    });
  
    // 2. Vérifier la langue du navigateur uniquement si c'est la première visite.
    if (!localStorage.getItem("userLang")) {
      const browserLang = navigator.language || navigator.userLanguage;
      const defaultLang = browserLang.startsWith("fr") ? "fr" : "en";
      localStorage.setItem("userLang", defaultLang);
  
      const currentPath = window.location.pathname;
      // Si le fichier actuel ne correspond pas à la langue par défaut, rediriger.
      if (!currentPath.includes(`index-${defaultLang}.html`)) {
        window.location.href = `index-${defaultLang}.html`;
        return;
      }
    }
  
    // 3. Déclencher un événement personnalisé indiquant le changement de langue,
    //    au cas où d'autres modules souhaiteraient adapter leur interface.
    const currentLang = localStorage.getItem("userLang");
    const event = new CustomEvent("languageChanged", {
      detail: { language: currentLang },
    });
    document.dispatchEvent(event);
  });
   
  // Exemple de mise à jour d'éléments spécifiques lors du changement de langue
  document.addEventListener("languageChanged", async (event) => {
    // Si vous utilisez ChartManager ou d'autres modules dépendants de la langue, mettez-les à jour ici.
    if (typeof ChartManager !== "undefined") {
      ChartManager.updateAllChartLabels();
      ChartManager.updatePeriodTitles();
    }
    
    // Si d'autres modules (ex. MosqueTimeManager) doivent être réinitialisés, faites-le ici.
    if (typeof MosqueTimeManager !== "undefined") {
      const mosqueTimeManager = new MosqueTimeManager();
      await mosqueTimeManager.initialize();
    }
  });
  