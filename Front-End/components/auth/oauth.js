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
    console.log(
      "🚨 VÉRIFICATION CALLBACK au constructor - ATTENTE authService"
    );

    // Vérifier si authService est déjà disponible globalement
    if (window.authService) {
      console.log("✅ authService déjà disponible - Traitement immédiat");
      this.checkAuthCallback();
    } else {
      console.log("⏳ authService pas encore disponible - Attente...");

      // Attendre que authService soit disponible
      this.waitForAuthService().then(() => {
        console.log("✅ authService maintenant disponible - Traitement OAuth");
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
    console.log("🔧 Init OAuth handler (sans traitement callback immédiat)");

    this.initializeOAuthButtons();
    // initializeProfileCompletion() supprimée - plus besoin de formulaire de complétion
  }

  // Vérifier si on revient d'un callback OAuth
  async checkAuthCallback() {
    console.log(
      "🔍 DÉMARRAGE checkAuthCallback - URL actuelle:",
      window.location.href
    );

    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get("auth");
    const action = urlParams.get("action");
    const redirectTo = urlParams.get("redirect");
    const error = urlParams.get("message");

    console.log("🔍 Paramètres URL détectés:", {
      authStatus,
      action,
      redirectTo,
      error,
      fullURL: window.location.href,
    });

    if (authStatus === "success") {
      console.log("✅ OAuth SUCCESS détecté - action:", action);

      // Nettoyer l'URL immédiatement pour éviter les boucles
      window.history.replaceState({}, document.title, window.location.pathname);

      if (action === "complete_profile") {
        console.log(
          "🎯 OAuth complete_profile ignoré - Redirection directe vers dashboard"
        );

        // Déclencher l'événement login pour synchroniser l'état
        window.dispatchEvent(new Event("login"));

        // Redirection directe vers dashboard sans formulaire de complétion
        console.log("🚀 Redirection directe vers dashboard");
        navigateTo("dashboard");
      } else if (redirectTo === "dashboard") {
        console.log("🎯 DÉCLENCHEMENT: Redirection vers dashboard");

        // Authentification OAuth réussie - redirection vers dashboard
        console.log("OAuth réussi, redirection vers le dashboard");

        // Vérifier l'authentification via API
        try {
          console.log("🔍 Vérification authentification via API...");

          // Attendre un peu pour que les cookies soient bien définis
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Utiliser authService global
          if (!window.authService) {
            console.error("❌ authService non disponible!");
            throw new Error("authService non disponible");
          }

          const user = await window.authService.getProfile();

          if (user && user.id) {
            console.log("✅ Utilisateur authentifié via API:", {
              userId: user.id,
              username: user.username,
              email: user.email,
            });

            // ✅ NOUVELLE LOGIQUE : Plus besoin de récupérer le token JWT
            // Les cookies sont automatiquement définis par le serveur OAuth
            console.log("✅ OAuth réussi - Cookies automatiquement définis");

            // Déclencher l'événement login pour synchroniser l'état
            console.log("🎉 Déclenchement de l'événement 'login' après OAuth");
            window.dispatchEvent(new Event("login"));

            // Afficher une notification de succès
            notificationService.show("Connexion réussie via OAuth", "success");

            // Attendre que l'événement soit traité avant la redirection
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Redirection vers dashboard
            console.log("🚀 Redirection vers dashboard après OAuth");
            navigateTo("dashboard");
          } else {
            console.error("❌ ÉCHEC: Aucun utilisateur retourné par l'API");
            this.handleAuthError("auth_verification_failed");
          }
        } catch (error) {
          console.error("❌ ÉCHEC: Erreur lors de la vérification API:", error);
          this.handleAuthError("auth_verification_failed");
        }
      }
    } else if (authStatus === "error") {
      this.handleAuthError(error);
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      console.log("🔍 Aucun callback OAuth détecté - paramètres:", {
        authStatus,
        action,
        redirectTo,
        error,
      });
    }
  }

  // Initialiser les boutons OAuth dans les formulaires
  initializeOAuthButtons() {
    // Attendre que les formulaires soient complètement chargés
    setTimeout(() => {
      const signupTab = document.getElementById("welcomepage-signupTab");
      const signinTab = document.getElementById("welcomepage-signinTab");

      console.log("Initialisation des boutons OAuth:", {
        signupTab: !!signupTab,
        signinTab: !!signinTab,
      });

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
      console.log(
        `⚠️ Formulaire ${type} déjà initialisé avec OAuth, évitement du doublon`
      );
      return;
    }

    // 🧹 Supprimer les conteneurs OAuth existants pour éviter les doublons
    const existingOAuthContainers = form.querySelectorAll(".oauth-container");
    existingOAuthContainers.forEach((container) => container.remove());
    console.log(
      `🧹 Suppression de ${existingOAuthContainers.length} conteneurs OAuth existants`
    );

    // 🔒 Marquer comme initialisé
    form.setAttribute("oauth-initialized", "true");
    console.log(`🔒 Formulaire ${type} marqué comme initialisé`);

    // Créer le conteneur des boutons OAuth
    const oauthContainer = document.createElement("div");
    oauthContainer.className = "oauth-container";
    oauthContainer.innerHTML = `
      <div class="oauth-divider">
        <span>ou</span>
      </div>
      <div class="oauth-buttons">
        <button type="button" class="oauth-btn oauth-google" data-provider="google" style="pointer-events: all; cursor: pointer;">
          🔵 Google
        </button>
        <button type="button" class="oauth-btn oauth-microsoft" data-provider="microsoft" style="pointer-events: all; cursor: pointer;">
          🟦 Microsoft  
        </button>
        <button type="button" class="oauth-btn oauth-github" data-provider="github" style="pointer-events: all; cursor: pointer;">
          ⚫ GitHub
        </button>
        <button type="button" class="oauth-btn oauth-facebook" data-provider="facebook" style="pointer-events: all; cursor: pointer;">
          🔷 Facebook
        </button>
      </div>
    `;

    // Insérer avant le bouton de soumission
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      form.insertBefore(oauthContainer, submitButton);
    } else {
      form.appendChild(oauthContainer);
    }

    // 🔥 NOUVELLE SOLUTION : Event listeners DIRECTS sur chaque bouton
    const oauthButtons = oauthContainer.querySelectorAll(".oauth-btn");
    console.log(`📋 ${oauthButtons.length} boutons OAuth créés`);

    // Sauvegarder le contexte 'this'
    const self = this;

    oauthButtons.forEach((button, index) => {
      const provider = button.dataset.provider;
      console.log(`🔍 Bouton ${index}: ${provider}`);

      // 🎯 EVENT LISTENER DIRECT - Plus fiable que la délégation
      button.addEventListener("click", function (e) {
        console.log(`🔥 CLIC DIRECT DÉTECTÉ sur bouton ${provider}!`);

        e.preventDefault();
        e.stopPropagation();

        console.log(`🚀 Lancement OAuth pour: ${provider}`);
        self.handleOAuthLogin(provider);
      });

      // Event listener de secours
      button.addEventListener("mousedown", function (e) {
        console.log(`🖱️ MOUSEDOWN sur bouton ${provider}`);
      });

      // Rendre le bouton focusable et ajouter un event listener au clavier
      button.setAttribute("tabindex", "0");
      button.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          console.log(`⌨️ KEYBOARD CLICK sur bouton ${provider}`);
          e.preventDefault();
          self.handleOAuthLogin(provider);
        }
      });

      // Marquer comme actif pour les tests
      button.setAttribute("data-oauth-test", "active");
      button.setAttribute("data-clickable", "true");

      console.log(`✅ Event listeners DIRECTS ajoutés pour ${provider}`);
    });

    // Test global de détection de clic
    document.addEventListener("click", (e) => {
      if (e.target.closest(".oauth-btn")) {
        console.log(`🌍 Clic global détecté sur élément OAuth:`, e.target);
      }
    });

    // Test final : vérifier que les boutons sont bien dans le DOM
    setTimeout(() => {
      const testButtons = document.querySelectorAll(
        '.oauth-btn[data-oauth-test="active"]'
      );
      console.log(
        `🧪 Test final: ${testButtons.length} boutons OAuth trouvés dans le DOM`
      );

      testButtons.forEach((btn) => {
        console.log(`🧪 Bouton ${btn.dataset.provider} présent et actif`);
      });

      // 🎯 DIAGNOSTIC terminé - boutons prêts pour utilisation manuelle
      console.log("✅ Boutons OAuth prêts. Cliquez manuellement pour tester.");

      // 🔧 TEST DE CONSOLE : Fonction globale pour tester les clics
      window.testOAuthClick = function (provider) {
        console.log(`🧪 TEST CONSOLE: Simulation clic ${provider}`);
        const button = document.querySelector(`[data-provider="${provider}"]`);
        if (button) {
          console.log("🔍 Bouton trouvé:", button);
          button.click();
        } else {
          console.log("❌ Bouton non trouvé");
        }
      };

      // 🚨 FONCTION DE SECOURS : OAuth direct
      window.forceOAuth = function (provider) {
        console.log(`🚨 FORCER OAuth ${provider} directement`);
        const oauthHandler = window.oauthHandler || self;
        if (oauthHandler && oauthHandler.handleOAuthLogin) {
          oauthHandler.handleOAuthLogin(provider);
        } else {
          console.log("❌ oauthHandler non trouvé");
        }
      };

      // Exposer l'instance globalement
      window.oauthHandler = self;

      console.log("🛠️ TESTS DISPONIBLES:");
      console.log("  testOAuthClick('google') - Test clic bouton");
      console.log("  forceOAuth('google') - Forcer OAuth direct");
    }, 100);
  }

  // Gérer le login OAuth
  handleOAuthLogin(provider) {
    console.log(`🚀 handleOAuthLogin appelé pour: ${provider}`);

    const authUrl = `${this.apiBaseUrl}/api/auth/${provider}`;
    console.log(`URL OAuth générée: ${authUrl}`);

    // Sauvegarder l'état actuel si nécessaire
    sessionStorage.setItem("oauth_provider", provider);
    console.log(`Provider sauvegardé dans sessionStorage: ${provider}`);

    // Rediriger vers l'URL d'authentification OAuth
    console.log(`🔄 Redirection vers OAuth en cours...`);
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
    console.log("🔧 DEBUG OAuth - État initial:", {
      url: window.location.href,
      cookies: document.cookie,
      localStorage: {
        token: localStorage.getItem("token"),
        userLang: localStorage.getItem("userLang"),
      },
      apiBaseUrl: this.apiBaseUrl,
      environment:
        window.location.hostname === "localhost" ? "development" : "production",
    });

    // Écouter les changements de URL
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      console.log("🔄 Navigation pushState:", args[2]);
      return originalPushState.apply(this, args);
    };

    history.replaceState = function (...args) {
      console.log("🔄 Navigation replaceState:", args[2]);
      return originalReplaceState.apply(this, args);
    };

    window.addEventListener("popstate", (event) => {
      console.log("🔄 Navigation popstate:", window.location.href);
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
        console.warn("⚠️ Timeout: authService non disponible après 5s");
        resolve(); // Continuer quand même
      }, 5000);
    });
  }
}

// Exporter l'instance
export const oauthHandler = new OAuthHandler();
export default OAuthHandler;
