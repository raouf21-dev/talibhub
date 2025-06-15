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

    // 🔥 VÉRIFICATION IMMÉDIATE du callback au chargement
    console.log("🚨 VÉRIFICATION CALLBACK au constructor");
    this.checkAuthCallback();

    this.init();

    // 🔥 AUSSI vérifier quand le DOM est prêt
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        console.log("🚨 VÉRIFICATION CALLBACK après DOMContentLoaded");
        this.checkAuthCallback();
      });
    }
  }

  getApiBaseUrl() {
    const isDevelopment = window.location.hostname === "localhost";
    return isDevelopment ? "http://localhost:4000" : "https://talibhub.com";
  }

  init() {
    console.log("🔥 FORCER checkAuthCallback");
    this.checkAuthCallback();

    this.initializeOAuthButtons();
    this.initializeProfileCompletion();
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

      if (action === "complete_profile") {
        console.log("🎯 DÉCLENCHEMENT: Formulaire de completion de profil");

        // Pour les cookies httpOnly, on ne peut pas les lire côté client
        // Mais on peut vérifier si l'utilisateur est authentifié via l'API
        try {
          console.log("🔍 Vérification authentification via API...");
          const user = await authService.getProfile();

          if (user && user.id) {
            console.log("✅ Utilisateur authentifié via API:", {
              userId: user.id,
              username: user.username,
              email: user.email,
            });

            // Déclencher l'événement login pour synchroniser l'état
            window.dispatchEvent(new Event("login"));
            console.log("✅ Événement login déclenché après vérification API");
          } else {
            console.error("❌ ÉCHEC: Aucun utilisateur retourné par l'API");
          }
        } catch (error) {
          console.error("❌ ÉCHEC: Erreur lors de la vérification API:", error);
        }

        // Déclencher l'événement login aussi pour le profil incomplet
        console.log(
          "🎉 Déclenchement de l'événement 'login' pour profil incomplet"
        );
        window.dispatchEvent(new Event("login"));

        // Afficher le formulaire de complétion sur welcomepage
        this.showProfileCompletionForm();
      } else if (
        redirectTo === "dashboard" ||
        urlParams.get("redirect") === "dashboard"
      ) {
        console.log("🎯 DÉCLENCHEMENT: Redirection vers dashboard");

        // Authentification OAuth réussie
        console.log("OAuth réussi, redirection vers le dashboard");

        // Nettoyer l'URL d'abord
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        // Vérifier l'authentification via API au lieu de lire les cookies
        try {
          console.log("🔍 Vérification authentification via API...");
          const user = await authService.getProfile();

          if (user && user.id) {
            console.log("✅ Utilisateur authentifié via API:", {
              userId: user.id,
              username: user.username,
              email: user.email,
            });

            // Déclencher l'événement login pour synchroniser l'état
            console.log("🎉 Déclenchement de l'événement 'login' après OAuth");
            window.dispatchEvent(new Event("login"));

            // Afficher une notification de succès
            notificationService.show("Connexion réussie via OAuth", "success");

            // Redirection immédiate vers dashboard
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

  // Afficher le formulaire de complétion de profil
  showProfileCompletionForm() {
    console.log("🎯 showProfileCompletionForm - DÉMARRAGE");
    this.isProfileCompletionMode = true;

    // Masquer les formulaires d'authentification
    const authForms = document.getElementById("welcomepage-auth-forms");
    if (authForms) {
      authForms.style.display = "none";
      console.log("✅ Formulaires auth masqués");
    }

    // Créer et afficher le formulaire de complétion
    console.log("📝 Création du formulaire de complétion...");
    try {
      this.createProfileCompletionForm();
      console.log("✅ Formulaire de complétion créé avec succès");
    } catch (error) {
      console.error("❌ Erreur création formulaire:", error);
    }
  }

  // Créer le formulaire de complétion de profil
  createProfileCompletionForm() {
    const welcomeContainer = document.querySelector(".welcomepage-container");
    if (!welcomeContainer) return;

    const profileForm = document.createElement("div");
    profileForm.id = "oauth-profile-completion";
    profileForm.className = "welcomepage-auth-forms";
    profileForm.innerHTML = `
      <div class="welcomepage-card">
        <h3>Complétez votre profil</h3>
        <p>Quelques informations supplémentaires pour finaliser votre inscription :</p>
        <form id="oauth-profile-form">
          <div class="form-grid">
            <div class="welcomepage-form-group">
              <label for="oauth-username">Nom d'utilisateur</label>
              <input type="text" id="oauth-username" required />
            </div>
            <div class="welcomepage-form-group">
              <label for="oauth-firstName">Prénom</label>
              <input type="text" id="oauth-firstName" required />
            </div>
            <div class="welcomepage-form-group">
              <label for="oauth-lastName">Nom</label>
              <input type="text" id="oauth-lastName" required />
            </div>
            <div class="welcomepage-form-group">
              <label for="oauth-age">Âge</label>
              <input type="number" id="oauth-age" min="13" max="120" required />
            </div>
            <div class="welcomepage-form-group">
              <label for="oauth-gender">Genre</label>
              <select id="oauth-gender" required>
                <option value="">Sélectionner</option>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </select>
            </div>
            <div class="welcomepage-form-group">
              <label for="oauth-country">Pays (optionnel)</label>
              <input type="text" id="oauth-country" autocomplete="off" placeholder="Laissez vide si vous préférez" />
              <div id="oauth-country-list" role="listbox" aria-label="Country List">
                <!-- Country list items will be dynamically inserted here -->
              </div>
            </div>
          </div>
          <button type="submit" class="welcomepage-btn welcomepage-btn-primary">
            Finaliser l'inscription
          </button>
        </form>
      </div>
    `;

    welcomeContainer.appendChild(profileForm);

    // Initialiser le formulaire
    this.initializeProfileForm();
  }

  // Initialiser le formulaire de complétion de profil (avec pays - legacy)
  initializeProfileForm() {
    const form = document.getElementById("oauth-profile-form");
    if (!form) return;

    // Initialiser le champ pays avec autocomplétion
    this.initializeCountryInput("oauth-country", "oauth-country-list");

    // Gérer la soumission du formulaire
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleProfileCompletion();
    });
  }

  // Initialiser l'autocomplétion des pays
  async initializeCountryInput(inputId, listId) {
    const countryInput = document.getElementById(inputId);
    const countryList = document.getElementById(listId);

    if (!countryInput || !countryList) return;

    // Charger les pays
    const countries = await this.loadCountries();

    countryInput.addEventListener("input", () => {
      const query = countryInput.value.toLowerCase();
      this.displayCountries(countries, query, countryList, countryInput);
    });

    countryInput.addEventListener("focus", () => {
      const query = countryInput.value.toLowerCase();
      this.displayCountries(countries, query, countryList, countryInput);
    });

    // Masquer la liste quand on clique ailleurs
    document.addEventListener("click", (e) => {
      if (!countryInput.contains(e.target) && !countryList.contains(e.target)) {
        countryList.style.display = "none";
      }
    });
  }

  // Charger la liste des pays
  async loadCountries() {
    try {
      console.log("🔍 Chargement des pays...");
      const countriesData = await countriesCache.getCountries("fr");
      console.log("📋 Données pays reçues:", countriesData);

      // Convertir les objets {name, code} en simple tableau de noms
      const countryNames = countriesData.map((country) => country.name);
      console.log("✅ Noms des pays extraits:", countryNames.slice(0, 5));

      return countryNames;
    } catch (error) {
      console.error("Erreur lors du chargement des pays:", error);

      // Liste de secours en cas d'erreur
      return [
        "France",
        "Belgique",
        "Suisse",
        "Canada",
        "Maroc",
        "Algérie",
        "Tunisie",
        "Allemagne",
        "Espagne",
        "Italie",
      ];
    }
  }

  // Afficher les pays filtrés
  displayCountries(countries, query, listElement, inputElement) {
    if (!countries || countries.length === 0) return;

    const filteredCountries = countries.filter((country) =>
      country.toLowerCase().includes(query)
    );

    if (
      filteredCountries.length === 0 ||
      (query === "" && filteredCountries.length > 50)
    ) {
      listElement.style.display = "none";
      return;
    }

    listElement.innerHTML = filteredCountries
      .slice(0, 10)
      .map(
        (country) => `
        <div class="country-item" data-country="${country}">
          ${country}
        </div>
      `
      )
      .join("");

    // Ajouter les event listeners
    listElement.querySelectorAll(".country-item").forEach((item) => {
      item.addEventListener("click", () => {
        inputElement.value = item.dataset.country;
        listElement.style.display = "none";
      });
    });

    listElement.style.display = "block";
  }

  // Gérer la complétion du profil
  async handleProfileCompletion() {
    try {
      const countryValue = document
        .getElementById("oauth-country")
        .value.trim();

      const formData = {
        firstName: document.getElementById("oauth-firstName").value.trim(),
        lastName: document.getElementById("oauth-lastName").value.trim(),
        age: document.getElementById("oauth-age").value,
        gender: document.getElementById("oauth-gender").value,
        country: countryValue || null, // null si vide, sinon la valeur
        username: document.getElementById("oauth-username").value.trim(),
      };

      console.log("📋 Données du formulaire à envoyer:", formData);

      // Validation des champs obligatoires seulement
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.age ||
        !formData.gender ||
        !formData.username
      ) {
        notificationService.show(
          "Les champs nom, prénom, âge, genre et nom d'utilisateur sont obligatoires",
          "warning"
        );
        return;
      }

      // Envoyer les données
      const response = await api.post("/auth/complete-profile", formData);

      if (response.success) {
        notificationService.show("Profil complété avec succès !", "success");

        // Déclencher l'événement login pour rafraîchir l'interface
        window.dispatchEvent(new Event("login"));

        // Déclencher un événement spécifique pour forcer la mise à jour du profil
        window.dispatchEvent(new Event("profileUpdated"));

        console.log(
          "🚀 Redirection immédiate vers dashboard après complétion profil"
        );
        navigateTo("dashboard");
      } else {
        throw new Error(
          response.message || "Erreur lors de la complétion du profil"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la complétion du profil:", error);
      notificationService.show(
        error.message || "Erreur lors de la complétion du profil",
        "error"
      );
    }
  }

  // Initialiser la complétion de profil (appelée depuis l'extérieur)
  initializeProfileCompletion() {
    // Cette méthode peut être utilisée pour initialiser la complétion de profil
    // depuis d'autres parties de l'application
  }
}

// Exporter l'instance
export const oauthHandler = new OAuthHandler();
export default OAuthHandler;
