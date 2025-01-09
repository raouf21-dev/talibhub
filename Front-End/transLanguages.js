// transLanguages.js
import { ChartManager } from './charts.js';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Gérer les clics sur les boutons de langue
    const langButtons = document.querySelectorAll(".lang-btn");
    langButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            const selectedLang = button.getAttribute("data-lang");
            localStorage.setItem("userLang", selectedLang);
            window.location.href = `index-${selectedLang}.html`;
        });
    });

    // 2. Vérifier la langue du navigateur uniquement si c'est la première visite
    if (!localStorage.getItem("userLang")) {
        const browserLang = navigator.language || navigator.userLanguage;
        const defaultLang = browserLang.startsWith("fr") ? "fr" : "en";
        localStorage.setItem("userLang", defaultLang);
        
        const currentPath = window.location.pathname;
        if (!currentPath.includes(`index-${defaultLang}.html`)) {
            window.location.href = `index-${defaultLang}.html`;
            return;
        }
    }

    // 3. Déclencher l'événement de changement de langue pour mettre à jour l'interface
    const currentLang = localStorage.getItem("userLang");
    const event = new CustomEvent('languageChanged', {
        detail: { language: currentLang }
    });
    document.dispatchEvent(event);
});

// Mettre à jour l'interface lors du changement de langue
document.addEventListener('languageChanged', async (event) => {
  if (ChartManager) {
      ChartManager.updateAllChartLabels();
      ChartManager.updatePeriodTitles();
  }

  if (typeof MosqueTimeManager !== 'undefined') {
      const mosqueTimeManager = new MosqueTimeManager();
      await mosqueTimeManager.initialize();
  }
});