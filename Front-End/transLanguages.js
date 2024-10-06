// transLanguages.js

document.addEventListener("DOMContentLoaded", () => {
    const langButtons = document.querySelectorAll(".lang-btn");

    langButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        // Empêcher le comportement par défaut
        e.preventDefault();

        // Obtenir la langue sélectionnée
        const selectedLang = button.getAttribute("data-lang");

        // Enregistrer la préférence de langue
        localStorage.setItem("userLang", selectedLang);

        // Rediriger vers la page correspondante
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