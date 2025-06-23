import { api } from "../../services/api/dynamicLoader.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import { authService } from "../../services/auth/authService.js";
import { navigateTo } from "../../utils/utils.js";
import { countriesCache } from "../../services/cache/cacheCountries.js";

class OAuthHandler {
  constructor() {
    this.apiBaseUrl = this.getApiBaseUrl();
    this.isProfileCompletionMode = false;
    this.isInitialized = false; // 🔒 Protection contre double initialisation
    this.globalEventListenerAdded = false; // 🔒 Protection contre event listeners multiples

    // 🔧 MODIFICATION CRITIQUE: Différer le traitement OAuth jusqu'à ce que authService soit disponible

    // Vérifier si authService est déjà disponible globalement
    if (window.authService) {
      this.checkAuthCallback();
    } else {
      // Attendre que authService soit disponible
      this.waitForAuthService().then(() => {
        this.checkAuthCallback();
      });
    }

    this.init();

    // 🔧 Ajouter des outils de débogage
    this.debugOAuth();
  }

  getApiBaseUrl() {
    const isDevelopment = window.location.hostname === "localhost";
    return isDevelopment ? "http://localhost:4000" : "https://talibhub.com";
  }

  init() {
    this.initializeOAuthButtons();
    // initializeProfileCompletion() supprimée - plus besoin de formulaire de complétion
  }

  // Vérifier si on revient d'un callback OAuth
  async checkAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get("auth");
    const action = urlParams.get("action");
    const redirectTo = urlParams.get("redirect");
    const error = urlParams.get("message");

    if (authStatus === "success") {
      // Nettoyer l'URL immédiatement pour éviter les boucles
      window.history.replaceState({}, document.title, window.location.pathname);

      if (action === "complete_profile") {
        // Déclencher l'événement login pour synchroniser l'état
        window.dispatchEvent(new Event("login"));

        // Redirection directe vers dashboard sans formulaire de complétion
        navigateTo("dashboard");
      } else if (redirectTo === "dashboard") {
        // Authentification OAuth réussie - redirection vers dashboard

        // Vérifier l'authentification via API
        try {
          // Attendre un peu pour que les cookies soient bien définis
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Utiliser authService global
          if (!window.authService) {
            throw new Error("authService non disponible");
          }

          const user = await window.authService.getProfile();

          if (user && user.id) {
            // ✅ NOUVELLE LOGIQUE : Plus besoin de récupérer le token JWT
            // Les cookies sont automatiquement définis par le serveur OAuth

            // Déclencher l'événement login pour synchroniser l'état
            window.dispatchEvent(new Event("login"));

            // Afficher une notification de succès
            notificationService.show("Connexion réussie via OAuth", "success");

            // Attendre que l'événement soit traité avant la redirection
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Redirection vers dashboard
            navigateTo("dashboard");
          } else {
            this.handleAuthError("auth_verification_failed");
          }
        } catch (error) {
          this.handleAuthError("auth_verification_failed");
        }
      }
    } else if (authStatus === "error") {
      this.handleAuthError(error);
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Aucun callback OAuth détecté
    }
  }

  // Initialiser les boutons OAuth dans les formulaires
  initializeOAuthButtons() {
    // Attendre que les formulaires soient complètement chargés
    setTimeout(() => {
      const signupTab = document.getElementById("welcomepage-signupTab");
      const signinTab = document.getElementById("welcomepage-signinTab");

      if (signupTab) {
        this.addOAuthButtons(signupTab, "signup");
      }
      if (signinTab) {
        this.addOAuthButtons(signinTab, "signin");
      }
    }, 500);
  }

  // Ajouter les boutons OAuth à un formulaire
  addOAuthButtons(container, type) {
    const form = container.querySelector("form");
    if (!form) return;

    // 🔒 PROTECTION RENFORCÉE : Vérifier si déjà traité
    if (form.hasAttribute("oauth-initialized")) {
      return;
    }

    // 🧹 Supprimer les conteneurs OAuth existants pour éviter les doublons
    const existingOAuthContainers = form.querySelectorAll(".oauth-container");
    existingOAuthContainers.forEach((container) => container.remove());

    // 🔒 Marquer comme initialisé
    form.setAttribute("oauth-initialized", "true");

    // Créer le conteneur des boutons OAuth
    const oauthContainer = document.createElement("div");
    oauthContainer.className = "oauth-container";
    oauthContainer.innerHTML = `
      <div class="oauth-buttons">
        <button type="button" class="oauth-btn oauth-google" data-provider="google" style="pointer-events: all; cursor: pointer;">
          <svg class="oauth-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
        <button type="button" class="oauth-btn oauth-microsoft" data-provider="microsoft" style="pointer-events: all; cursor: pointer;">
          <svg class="oauth-icon" viewBox="0 0 24 24">
            <path fill="#F25022" d="M1 1h10v10H1z"/>
            <path fill="#00BCF2" d="M13 1h10v10H13z"/>
            <path fill="#00B04F" d="M1 13h10v10H1z"/>
            <path fill="#FFBA00" d="M13 13h10v10H13z"/>
          </svg>
          Microsoft
        </button>
      </div>
      <div class="oauth-divider">
        <span data-translate="auth.or">ou</span>
      </div>
    `;

    // Insérer en haut du formulaire après le titre h3
    const formTitle = form.querySelector("h3");
    if (formTitle && formTitle.nextSibling) {
      form.insertBefore(oauthContainer, formTitle.nextSibling);
    } else {
      // Si pas de titre h3, insérer au début du formulaire
      form.insertBefore(oauthContainer, form.firstChild);
    }

    // 🔥 NOUVELLE SOLUTION : Event listeners DIRECTS sur chaque bouton
    const oauthButtons = oauthContainer.querySelectorAll(".oauth-btn");

    // Sauvegarder le contexte 'this'
    const self = this;

    oauthButtons.forEach((button, index) => {
      const provider = button.dataset.provider;

      // 🎯 EVENT LISTENER DIRECT - Plus fiable que la délégation
      button.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        self.handleOAuthLogin(provider);
      });

      // Event listener de secours
      button.addEventListener("mousedown", function (e) {});

      // Rendre le bouton focusable et ajouter un event listener au clavier
      button.setAttribute("tabindex", "0");
      button.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          self.handleOAuthLogin(provider);
        }
      });

      // Marquer comme actif pour les tests
      button.setAttribute("data-oauth-test", "active");
      button.setAttribute("data-clickable", "true");
    });

    // Test global de détection de clic
    document.addEventListener("click", (e) => {
      if (e.target.closest(".oauth-btn")) {
        // Clic global détecté sur élément OAuth
      }
    });

    // Test final : vérifier que les boutons sont bien dans le DOM
    setTimeout(() => {
      const testButtons = document.querySelectorAll(
        '.oauth-btn[data-oauth-test="active"]'
      );

      testButtons.forEach((btn) => {
        // Bouton présent et actif
      });

      // 🔧 TEST DE CONSOLE : Fonction globale pour tester les clics
      window.testOAuthClick = function (provider) {
        const button = document.querySelector(`[data-provider="${provider}"]`);
        if (button) {
          button.click();
        }
      };

      // 🚨 FONCTION DE SECOURS : OAuth direct
      window.forceOAuth = function (provider) {
        const oauthHandler = window.oauthHandler || self;
        if (oauthHandler && oauthHandler.handleOAuthLogin) {
          oauthHandler.handleOAuthLogin(provider);
        }
      };

      // Exposer l'instance globalement
      window.oauthHandler = self;
    }, 100);
  }

  // Gérer le login OAuth
  handleOAuthLogin(provider) {
    const authUrl = `${this.apiBaseUrl}/api/auth/${provider}`;

    // Sauvegarder l'état actuel si nécessaire
    sessionStorage.setItem("oauth_provider", provider);

    // Rediriger vers l'URL d'authentification OAuth
    window.location.href = authUrl;
  }

  // Gérer les erreurs OAuth
  handleAuthError(error) {
    let message = "Erreur d'authentification";

    switch (error) {
      case "EMAIL_ALREADY_EXISTS":
        message =
          "Un compte avec cet email existe déjà. Veuillez vous connecter avec votre mot de passe.";
        break;
      case "EMAIL_NOT_PROVIDED":
        message =
          "L'email n'a pas pu être récupéré depuis le provider. Veuillez réessayer.";
        break;
      case "no_user_data":
        message = "Aucune donnée utilisateur reçue. Veuillez réessayer.";
        break;
      case "callback_error":
        message =
          "Erreur lors du traitement de l'authentification. Veuillez réessayer.";
        break;
      case "auth_verification_failed":
        message =
          "Erreur de vérification de l'authentification. Veuillez vous reconnecter.";
        break;
      default:
        message = "Erreur d'authentification. Veuillez réessayer.";
    }

    notificationService.show(message, "error");
  }

  // MÉTHODES D'AFFICHAGE OAUTH SUPPRIMÉES
  // Les utilisateurs OAuth sont maintenant directement redirigés vers le dashboard

  // MÉTHODES DE COMPLÉTION OAUTH SUPPRIMÉES
  // Les utilisateurs OAuth sont maintenant directement redirigés vers le dashboard
  // si leur profil contient au minimum first_name et last_name

  // 🔧 Fonction de débogage OAuth
  debugOAuth() {
    // Écouter les changements de URL
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      return originalPushState.apply(this, args);
    };

    history.replaceState = function (...args) {
      return originalReplaceState.apply(this, args);
    };

    window.addEventListener("popstate", (event) => {
      // Navigation popstate
    });
  }

  // Nouvelle méthode pour attendre authService
  async waitForAuthService() {
    return new Promise((resolve) => {
      // Vérifier toutes les 100ms si authService est disponible
      const checkInterval = setInterval(() => {
        if (window.authService) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout après 5 secondes
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(); // Continuer quand même
      }, 5000);
    });
  }
}

// Exporter l'instance
export const oauthHandler = new OAuthHandler();
export default OAuthHandler;
