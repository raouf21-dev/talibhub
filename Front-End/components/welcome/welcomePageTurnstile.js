// welcomePageTurnstile.js

import { initializeTabToggle } from "../../utils/utils.js";
import { authService } from "../../services/auth/authService.js";
import { navigateTo } from "../../utils/utils.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import { WelcomeMosqueTime } from "./welcomeMosqueTime.js";
import TurnstileHandler from "../auth/turnstile.js";

export async function initializeWelcomepageWithTurnstile() {
  try {
    // Initialiser Turnstile
    let turnstileHandler;

    // Attendre un court instant pour s'assurer que Feather est chargé
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (window.feather) {
      window.feather.replace();
    }

    // Initialiser Turnstile avec gestion d'erreur
    try {
      turnstileHandler = new TurnstileHandler();
      console.log("Turnstile Handler initialisé avec succès");
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Turnstile:", error);
      notificationService.show(
        "Erreur de configuration de sécurité. Veuillez contacter l'administrateur.",
        "error"
      );
      return;
    }

    // Gestion du bouton Get Started
    const getStartedBtn = document.getElementById("welcomepage-getStartedBtn");
    const authForms = document.getElementById("welcomepage-auth-forms");
    if (getStartedBtn && authForms) {
      getStartedBtn.addEventListener("click", async () => {
        getStartedBtn.style.display = "none";
        authForms.classList.remove("hidden");
        authForms.style.display = "block";

        // Rafraîchir Turnstile quand le formulaire devient visible
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (turnstileHandler) {
          await turnstileHandler.refresh();
        }
      });
    }

    // Initialisation du basculement des onglets
    initializeTabToggle();

    // Gestion du changement d'onglet pour rafraîchir Turnstile si nécessaire
    document.addEventListener("click", async (e) => {
      if (e.target.matches('.welcomepage-tab-btn[data-tab="signup"]')) {
        // Attendre que l'onglet soit activé
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (turnstileHandler) {
          await turnstileHandler.refresh();
        } else {
          turnstileHandler = new TurnstileHandler();
        }
      }
    });

    // Ajout de l'écouteur pour le formulaire Sign Up avec Turnstile
    const signupForm = document.getElementById("welcomepage-signupForm");
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
          // Vérification Turnstile
          if (!turnstileHandler) {
            notificationService.show("CAPTCHA non initialisé", "error");
            return;
          }

          const token = turnstileHandler.getToken();
          if (!token) {
            notificationService.show(
              "Veuillez compléter la vérification CAPTCHA",
              "warning"
            );
            return;
          }

          const isTurnstileValid = await turnstileHandler.verify();

          if (!isTurnstileValid) {
            notificationService.show(
              "Échec de la vérification CAPTCHA",
              "error"
            );
            turnstileHandler.reset();
            return;
          }

          // Récupérer les données du formulaire
          const formData = {
            username: document
              .getElementById("welcomepage-username")
              .value.trim(),
            firstName: document
              .getElementById("welcomepage-firstName")
              .value.trim(),
            lastName: document
              .getElementById("welcomepage-lastName")
              .value.trim(),
            age: document.getElementById("welcomepage-age").value,
            gender: document.getElementById("welcomepage-gender").value,
            country: document
              .getElementById("welcomepage-country")
              .value.trim(),
            email: document.getElementById("welcomepage-email").value.trim(),
            confirmEmail: document
              .getElementById("welcomepage-confirmEmail")
              .value.trim(),
            password: document.getElementById("welcomepage-password").value,
            confirmPassword: document.getElementById(
              "welcomepage-confirmPassword"
            ).value,
            terms: document.getElementById("welcomepage-terms").checked,
          };

          // Validations côté client
          if (!validateFormData(formData)) {
            turnstileHandler.reset();
            return;
          }

          // Envoyer les données d'inscription
          const result = await authService.register(formData);

          if (result.success) {
            notificationService.show(
              "Inscription réussie ! Veuillez vérifier votre email.",
              "success"
            );
            // Optionnel : rediriger vers la page de connexion
            document
              .querySelector('.welcomepage-tab-btn[data-tab="signin"]')
              .click();
          } else {
            notificationService.show(
              result.message || "Erreur lors de l'inscription",
              "error"
            );
            turnstileHandler.reset();
          }
        } catch (error) {
          console.error("Erreur inscription:", error);
          notificationService.show("Erreur lors de l'inscription", "error");
          if (turnstileHandler) {
            turnstileHandler.reset();
          }
        }
      });
    }

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
          notificationService.show("Tous les champs sont requis", "warning");
          return;
        }

        try {
          const result = await authService.login(email, password);
          if (result.success) {
            localStorage.setItem("token", result.token);
            await navigateTo("dashboard");
          } else {
            notificationService.show("Erreur de connexion", "error");
          }
        } catch (error) {
          notificationService.show("Erreur de connexion", "error");
        }
      });
    }

    // Gestion des événements Turnstile
    document.addEventListener("turnstile-success", (e) => {
      console.log("Turnstile résolu:", e.detail.token);
    });

    document.addEventListener("turnstile-error", () => {
      notificationService.show("Erreur CAPTCHA", "error");
    });

    document.addEventListener("turnstile-expired", () => {
      notificationService.show("CAPTCHA expiré, veuillez réessayer", "warning");
    });

    document.addEventListener("turnstile-timeout", () => {
      notificationService.show(
        "CAPTCHA timeout, veuillez réessayer",
        "warning"
      );
    });

    // Initialisation de MosqueTime pour la page d'accueil
    try {
      const welcomeMosqueTime = new WelcomeMosqueTime();
      await welcomeMosqueTime.initialize();

      document.addEventListener("languageChanged", async () => {
        await welcomeMosqueTime.initialize();
      });
    } catch (error) {
      notificationService.show("Erreur d'initialisation", "error");
    }
  } catch (error) {
    console.error("Erreur initialisation page d'accueil:", error);
  }
}

function validateFormData(data) {
  // Validation des champs requis
  const requiredFields = [
    "username",
    "firstName",
    "lastName",
    "age",
    "gender",
    "country",
    "email",
    "password",
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      notificationService.show(`Le champ ${field} est requis`, "warning");
      return false;
    }
  }

  // Validation email
  if (data.email !== data.confirmEmail) {
    notificationService.show(
      "Les adresses email ne correspondent pas",
      "warning"
    );
    return false;
  }

  // Validation mot de passe
  if (data.password !== data.confirmPassword) {
    notificationService.show(
      "Les mots de passe ne correspondent pas",
      "warning"
    );
    return false;
  }

  if (data.password.length < 8) {
    notificationService.show(
      "Le mot de passe doit contenir au moins 8 caractères",
      "warning"
    );
    return false;
  }

  // Validation termes
  if (!data.terms) {
    notificationService.show(
      "Vous devez accepter les conditions d'utilisation",
      "warning"
    );
    return false;
  }

  return true;
}
 