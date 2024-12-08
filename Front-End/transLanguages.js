// transLanguages.js

document.addEventListener("DOMContentLoaded", () => {
  const langButtons = document.querySelectorAll(".lang-btn");

  langButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
          e.preventDefault();
          const selectedLang = button.getAttribute("data-lang");
          
          // Mettre à jour la langue du document
          document.documentElement.lang = selectedLang;
          
          // Déclencher un événement personnalisé pour le changement de langue
          const event = new CustomEvent('languageChanged', {
              detail: { language: selectedLang }
          });
          document.dispatchEvent(event);
          
          // Enregistrer la préférence
          localStorage.setItem("userLang", selectedLang);
          
          // Rediriger si nécessaire
          window.location.href = `index-${selectedLang}.html`;
      });
  });

    // Vérifier si la préférence de langue est déjà enregistrée
    const userLangPreference = localStorage.getItem("userLang");
    const currentPage = window.location.pathname;

    if (
      !userLangPreference &&
      (currentPage === "/" || currentPage.endsWith("index.html"))
    ) {
      // Si aucune préférence n'est enregistrée, détecter la langue du navigateur
      const browserLang = navigator.language || navigator.userLanguage;
      const lang = browserLang.startsWith("fr") ? "fr" : "en";

      // Rediriger vers la page correspondante
      window.location.href = `index-${lang}.html`;

      // Enregistrer la préférence de langue
      localStorage.setItem("userLang", lang);
    }
  });

  document.addEventListener('languageChanged', async (event) => {
    const mosqueTimeManager = new MosqueTimeManager();
    await mosqueTimeManager.initialize();
});