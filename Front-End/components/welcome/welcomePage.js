// welcomepage.js

import { initializeTabToggle } from "../../utils/utils.js";
import { authService } from "../../services/auth/authService.js";
import { navigateTo } from "../../utils/utils.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import { WelcomeMosqueTime } from "./welcomeMosqueTime.js";

export async function initializeWelcomepage() {
  console.log("[DEBUG] WelcomePage: Début de l'initialisation");

  // Attendre que Feather soit complètement chargé
  await new Promise((resolve) => {
    if (window.feather && typeof window.feather.replace === "function") {
      resolve();
    } else {
      const checkFeather = setInterval(() => {
        if (window.feather && typeof window.feather.replace === "function") {
          clearInterval(checkFeather);
          resolve();
        }
      }, 100);

      // Timeout après 5 secondes
      setTimeout(() => {
        clearInterval(checkFeather);
        console.warn("[DEBUG] Timeout en attendant Feather");
        resolve();
      }, 5000);
    }
  });

  console.log("[DEBUG] WelcomePage: Feather est prêt");

  console.log(
    "[DEBUG] WelcomePage: État de l'authentification:",
    localStorage.getItem("token") ? "Token présent" : "Pas de token"
  );
  console.log("[DEBUG] WelcomePage: Chemin actuel:", window.location.pathname);

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
      // Masquer le bouton et afficher les formulaires d'authentification
      getStartedBtn.style.display = "none";
      authForms.classList.remove("hidden");
      authForms.style.display = "block";
      console.log("Authentication forms displayed.");
      // Optionnel : vous pouvez forcer l'activation d'un onglet, par exemple "signin"
      // switchTab("signin");  // (si nécessaire, en vous assurant que switchTab est correctement importé/initialisé)
    });
  } else {
    console.warn("Welcome Page: Element(s) not found.");
  }

  // Initialisation du basculement des onglets pour le formulaire Sign In / Sign Up
  initializeTabToggle();

  // Ajout de l'écouteur pour le formulaire Sign In
  const signinForm = document.getElementById("welcomepage-signinForm");
  if (signinForm) {
    signinForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Empêche le rechargement de la page

      // Récupération des valeurs saisies
      const email = document
        .getElementById("welcomepage-signin-email")
        .value.trim();
      const password = document
        .getElementById("welcomepage-signin-password")
        .value.trim();

      // Vérification que les champs ne sont pas vides
      if (!email || !password) {
        console.error("Veuillez remplir tous les champs.");
        return;
      }

      // Appel à votre service d'authentification
      try {
        const result = await authService.login(email, password);
        if (result.success) {
          // Sauvegarde du token et redirection vers le dashboard
          localStorage.setItem("token", result.token);
          await navigateTo("dashboard");
        } else {
          console.error("Authentification échouée:", result.message);
          notificationService.show("auth.signin.error", "error");
        }
      } catch (error) {
        console.error("Erreur lors de l'authentification :", error);
      }
    });
  } else {
    console.warn("Formulaire Sign In non trouvé.");
  }

  // Initialisation de MosqueTime pour la page d'accueil
  try {
    console.log("WelcomePage: Creating WelcomeMosqueTime instance");
    const welcomeMosqueTime = new WelcomeMosqueTime();
    console.log("WelcomePage: Initializing WelcomeMosqueTime");
    await welcomeMosqueTime.initialize();

    // Ajouter un écouteur pour les changements de langue
    document.addEventListener("languageChanged", async () => {
      console.log(
        "WelcomePage: Language changed, reinitializing WelcomeMosqueTime"
      );
      await welcomeMosqueTime.initialize();
    });

    console.log("WelcomePage: WelcomeMosqueTime initialized successfully");
  } catch (error) {
    console.error("WelcomePage: Error initializing MosqueTime:", error);
    notificationService.show("mosque.init.error", "error");
  }
}

// Fonction pour mettre à jour le contenu du formulaire d'inscription selon la langue
function updateSignupContent(language) {
  // Déterminer la langue (utiliser celle stockée dans localStorage si non spécifiée)
  const currentLang = language || localStorage.getItem("userLang") || "en";

  const signupTabContent = document.getElementById("welcomepage-signupTab");
  if (signupTabContent) {
    // Messages selon la langue
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

    // Utiliser les messages dans la langue appropriée (défaut: anglais)
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
