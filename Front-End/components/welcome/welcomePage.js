// welcomepage.js

import { initializeTabToggle } from "../../utils/utils.js";
import { authService } from "../../services/auth/authService.js";
import { navigateTo } from "../../utils/utils.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import { WelcomeMosqueTime } from "./welcomeMosqueTime.js";

export async function initializeWelcomepage() {
  try {
    // Attendre un court instant pour s'assurer que Feather est chargé
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (window.feather) {
      window.feather.replace();
    }

    // Désactiver l'onglet d'inscription
    const signupTab = document.querySelector(
      '.welcomepage-tab-btn[data-tab="signup"]'
    );
    if (signupTab) {
      signupTab.classList.add("disabled");
    }

    // Remplacer le contenu du formulaire d'inscription
    updateSignupContent();

    // Ajouter un écouteur pour les changements de langue
    document.addEventListener("languageChanged", (event) => {
      updateSignupContent(event.detail.language);
    });

    // Gestion du bouton Get Started
    const getStartedBtn = document.getElementById("welcomepage-getStartedBtn");
    const authForms = document.getElementById("welcomepage-auth-forms");
    if (getStartedBtn && authForms) {
      getStartedBtn.addEventListener("click", () => {
        getStartedBtn.style.display = "none";
        authForms.classList.remove("hidden");
        authForms.style.display = "block";
      });
    }

    // Initialisation du basculement des onglets pour le formulaire Sign In / Sign Up
    initializeTabToggle();

    // Ajout de l'écouteur pour le formulaire Sign In
    const signinForm = document.getElementById("welcomepage-signinForm");
    if (signinForm) {
      signinForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document
          .getElementById("welcomepage-signin-email")
          .value.trim();
        const password = document
          .getElementById("welcomepage-signin-password")
          .value.trim();

        if (!email || !password) {
          notificationService.show("auth.required.fields", "warning");
          return;
        }

        try {
          const result = await authService.login(email, password);
          if (result.success) {
            localStorage.setItem("token", result.token);
            await navigateTo("dashboard");
          } else {
            notificationService.show("auth.signin.error", "error");
          }
        } catch (error) {
          notificationService.show("auth.signin.error", "error");
        }
      });
    }

    // Initialisation de MosqueTime pour la page d'accueil
    try {
      const welcomeMosqueTime = new WelcomeMosqueTime();
      await welcomeMosqueTime.initialize();

      // 🔧 CORRECTION : Ne PAS ré-initialiser, juste mettre à jour l'interface
      document.addEventListener("languageChanged", async () => {
        console.log("WelcomePage: Language changed - updating interface");
        // Mettre à jour seulement les textes et l'interface, pas les event listeners
        welcomeMosqueTime.texts = welcomeMosqueTime.getLocalizedTexts();
        welcomeMosqueTime.updateInterface();
        // Optionnel : mettre à jour l'affichage si une ville est sélectionnée
        if (welcomeMosqueTime.selectedCity) {
          welcomeMosqueTime.updateDateDisplay(welcomeMosqueTime.selectedCity);
        }
      });
    } catch (error) {
      notificationService.show("mosque.init.error", "error");
    }
  } catch (error) {
    // Continuer malgré l'erreur de Feather
  }
}

// Fonction pour mettre à jour le contenu du formulaire d'inscription selon la langue
function updateSignupContent(language) {
  const currentLang = language || localStorage.getItem("userLang") || "en";

  const signupTabContent = document.getElementById("welcomepage-signupTab");
  if (signupTabContent) {
    const messages = {
      fr: {
        title: "Inscriptions temporairement fermées",
        message1:
          "Nous travaillons actuellement à l'amélioration de notre plateforme.",
        message2:
          "Les inscriptions seront à nouveau disponibles très prochainement.",
        message3: "Merci de votre compréhension et de votre patience.",
      },
      en: {
        title: "Registrations temporarily closed",
        message1: "We are currently working on improving our platform.",
        message2: "Registrations will be available again very soon.",
        message3: "Thank you for your understanding and patience.",
      },
    };

    const content = messages[currentLang] || messages.en;

    signupTabContent.innerHTML = `
      <div class="signup-closed-message">
        <h3>${content.title}</h3>
        <p>${content.message1}</p>
        <p>${content.message2}</p>
        <p>${content.message3}</p>
      </div>
    `;
  }
}
