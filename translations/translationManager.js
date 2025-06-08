/**
 * 🌍 Système de Traduction Avancé pour TalibHub
 * Support JSON complet, pluralisation, messages dynamiques
 */

class AdvancedTranslationManager {
  constructor() {
    this.currentLanguage = "en";
    this.translations = {};
    this.messages = {};
    this.initialized = false;
    this.fallbackLanguage = "en";

    // Configuration des sélecteurs pour traduction automatique
    this.selectors = {
      // Navigation
      "navigation.sidebar.title": [".sidebar-header h1", ".app-branding h1"],
      "navigation.sidebar.dashboard": '[data-destination="dashboard"]',
      "navigation.sidebar.todoLists": '[data-destination="todoLists"]',
      "navigation.sidebar.apprentissage": '[data-destination="apprentissage"]',
      "navigation.sidebar.statistics": '[data-destination="statistics"]',
      "navigation.sidebar.salatSurahSelector":
        '[data-destination="salatSurahSelector"]',
      "navigation.sidebar.duaTimeCalculator":
        '[data-destination="duaTimeCalculator"]',
      "navigation.sidebar.surahmemorization":
        '[data-destination="surahmemorization"]',
      "navigation.sidebar.mosquetime": '[data-destination="mosquetime"]',

      // Top Navigation
      "navigation.topnav.profile": '[data-destination="profile"]',
      "navigation.topnav.contribution": '[data-destination="price"]',
      "navigation.topnav.contact": '[data-destination="contactform"]',
      "navigation.topnav.aboutus": '[data-destination="aboutus"]',
      "navigation.topnav.theme": ".theme-toggle span",
      "navigation.topnav.logout": "#logoutBtn",

      // Welcome Page - Hero
      "welcomepage.hero.title": "#welcomepage-hero h2",
      "welcomepage.hero.subtitle": "#welcomepage-hero p",
      "welcomepage.hero.getStarted": "#welcomepage-getStartedBtn",

      // Welcome Page - Auth
      "welcomepage.auth.tabs.signup": '[data-tab="signup"]',
      "welcomepage.auth.tabs.signin": '[data-tab="signin"]',
      "welcomepage.auth.signup.title": "#welcomepage-signupTab h3",
      "welcomepage.auth.signin.title": "#welcomepage-signinTab h3",

      // Features Section
      "welcomepage.features.title": "#welcomepage-features h2",

      // Dashboard
      "dashboard.title": ".dashboard-main-content h1",

      // Sections titles
      "apprentissage.title": "#apprentissage h1",
      "statistics.title": "#statistics h1",
      "todoLists.title": "#todoLists h1",
      "surahmemorization.title": "#surahmemorization h1",
      "mosquetime.title": ".mosquetime-title",
      "profile.title": "#profile h1",
      "salatSurahSelector.title": "#salatSurahSelector h1",
      "duaTimeCalculator.title": "#duaTimeCalculator h1",
      "price.title": ".price-title",
      "aboutus.title": ".aboutus-title",
      "contactform.title": "#contactform h1",
    };

    this.bindEvents();
  }

  /**
   * Initialisation du système de traduction
   */
  async init() {
    try {
      // Charger la langue par défaut (anglais déjà dans le HTML)
      this.currentLanguage = this.getStoredLanguage() || "en";

      if (this.currentLanguage !== "en") {
        await this.loadLanguage(this.currentLanguage);
        this.applyTranslations();
      }

      this.initialized = true;
      this.updateLanguageButtons();

      // Émettre événement pour compatibilité
      document.dispatchEvent(
        new CustomEvent("translationManagerReady", {
          detail: { language: this.currentLanguage },
        })
      );

      console.log("🌍 [AdvancedTranslationManager] Système initialisé", {
        language: this.currentLanguage,
        hasTranslations: Object.keys(this.translations).length > 0,
      });
    } catch (error) {
      console.error(
        "❌ [AdvancedTranslationManager] Erreur d'initialisation:",
        error
      );
    }
  }

  /**
   * Charger une langue spécifique
   */
  async loadLanguage(language) {
    try {
      if (language === "en") {
        // Anglais = langue par défaut du HTML
        this.translations = {};
        this.messages = {};
        return;
      }

      // Charger les traductions principales
      const translationsResponse = await fetch(
        `/translations/${language}.json`
      );
      if (!translationsResponse.ok) {
        throw new Error(`Impossible de charger ${language}.json`);
      }
      this.translations = await translationsResponse.json();

      // Charger les messages d'erreur
      const messagesResponse = await fetch(
        `/translations/${language}-messages.json`
      );
      if (!messagesResponse.ok) {
        throw new Error(`Impossible de charger ${language}-messages.json`);
      }
      this.messages = await messagesResponse.json();

      console.log("✅ [AdvancedTranslationManager] Langue chargée:", language);
    } catch (error) {
      console.error(
        `❌ [AdvancedTranslationManager] Erreur de chargement ${language}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Changer de langue
   */
  async changeLanguage(language) {
    if (this.currentLanguage === language) return;

    try {
      await this.loadLanguage(language);
      this.currentLanguage = language;
      this.storeLanguage(language);

      if (language !== "en") {
        this.applyTranslations();
      } else {
        // Recharger la page pour revenir à l'anglais
        window.location.reload();
      }

      this.updateLanguageButtons();

      // Émettre événement pour les autres modules
      document.dispatchEvent(
        new CustomEvent("languageChanged", {
          detail: {
            language: language,
            translations: this.translations,
            messages: this.messages,
          },
        })
      );

      console.log("🔄 [AdvancedTranslationManager] Langue changée:", language);
    } catch (error) {
      console.error(
        "❌ [AdvancedTranslationManager] Erreur changement langue:",
        error
      );
    }
  }

  /**
   * Appliquer toutes les traductions
   */
  applyTranslations() {
    if (
      this.currentLanguage === "en" ||
      Object.keys(this.translations).length === 0
    ) {
      return;
    }

    // 1. Traductions par sélecteurs CSS automatiques
    this.applyBySelectorMappings();

    // 2. Traductions par attributs data-translate (pour compatibilité)
    this.applyByDataAttributes();

    // 3. Traductions spéciales (formulaires, listes, etc.)
    this.applySpecialTranslations();

    console.log("✅ [AdvancedTranslationManager] Traductions appliquées");
  }

  /**
   * Traductions automatiques par sélecteurs
   */
  applyBySelectorMappings() {
    for (const [translationKey, selectors] of Object.entries(this.selectors)) {
      const translation = this.getNestedValue(
        this.translations,
        translationKey
      );
      if (!translation) continue;

      const selectorArray = Array.isArray(selectors) ? selectors : [selectors];

      selectorArray.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          if (element) {
            element.textContent = translation;
          }
        });
      });
    }
  }

  /**
   * Traductions par attributs data-translate (compatibilité)
   */
  applyByDataAttributes() {
    const elements = document.querySelectorAll("[data-translate]");
    elements.forEach((element) => {
      const key = element.getAttribute("data-translate");
      const translation = this.getNestedValue(this.translations, key);
      if (translation) {
        element.textContent = translation;
      }
    });
  }

  /**
   * Traductions spéciales pour contenu complexe
   */
  applySpecialTranslations() {
    this.translateFormLabels();
    this.translatePlaceholders();
    this.translateButtons();
    this.translateFeatureCards();
    this.translateSelectOptions();
  }

  /**
   * Traduire les labels de formulaires
   */
  translateFormLabels() {
    // Signup form
    const signupLabels = {
      "welcomepage-username": "welcomepage.auth.signup.username",
      "welcomepage-firstName": "welcomepage.auth.signup.firstName",
      "welcomepage-lastName": "welcomepage.auth.signup.lastName",
      "welcomepage-age": "welcomepage.auth.signup.age",
      "welcomepage-gender": "welcomepage.auth.signup.gender",
      "welcomepage-country": "welcomepage.auth.signup.country",
      "welcomepage-email": "welcomepage.auth.signup.email",
      "welcomepage-confirmEmail": "welcomepage.auth.signup.confirmEmail",
      "welcomepage-password": "welcomepage.auth.signup.password",
      "welcomepage-confirmPassword": "welcomepage.auth.signup.confirmPassword",
    };

    for (const [elementId, translationKey] of Object.entries(signupLabels)) {
      const label = document.querySelector(`label[for="${elementId}"]`);
      if (label) {
        const translation = this.getNestedValue(
          this.translations,
          translationKey
        );
        if (translation) {
          label.textContent = translation;
        }
      }
    }

    // Signin form
    const signinEmailLabel = document.querySelector(
      'label[for="welcomepage-signin-email"]'
    );
    if (signinEmailLabel) {
      const translation = this.getNestedValue(
        this.translations,
        "welcomepage.auth.signin.email"
      );
      if (translation) signinEmailLabel.textContent = translation;
    }

    const signinPasswordLabel = document.querySelector(
      'label[for="welcomepage-signin-password"]'
    );
    if (signinPasswordLabel) {
      const translation = this.getNestedValue(
        this.translations,
        "welcomepage.auth.signin.password"
      );
      if (translation) signinPasswordLabel.textContent = translation;
    }
  }

  /**
   * Traduire les placeholders
   */
  translatePlaceholders() {
    const placeholders = {
      "todo-new-task": "todoLists.addTask",
      duaCityInput: "duaTimeCalculator.cityPlaceholder",
    };

    for (const [elementId, translationKey] of Object.entries(placeholders)) {
      const element = document.getElementById(elementId);
      if (element) {
        const translation = this.getNestedValue(
          this.translations,
          translationKey
        );
        if (translation) {
          element.placeholder = translation;
        }
      }
    }
  }

  /**
   * Traduire les boutons
   */
  translateButtons() {
    // Bouton créer compte
    const createAccountBtn = document.querySelector(
      '#welcomepage-signupForm button[type="submit"]'
    );
    if (createAccountBtn) {
      const translation = this.getNestedValue(
        this.translations,
        "welcomepage.auth.signup.createAccount"
      );
      if (translation) createAccountBtn.textContent = translation;
    }

    // Bouton connexion
    const signInBtn = document.querySelector(
      '#welcomepage-signinForm button[type="submit"]'
    );
    if (signInBtn) {
      const translation = this.getNestedValue(
        this.translations,
        "welcomepage.auth.signin.submit"
      );
      if (translation) signInBtn.textContent = translation;
    }
  }

  /**
   * Traduire les cartes de fonctionnalités
   */
  translateFeatureCards() {
    const featureCards = document.querySelectorAll(".welcomepage-feature-card");
    const features = [
      "talibTimer",
      "surahSelector",
      "surahMemorization",
      "duaTimeCalculator",
      "mosqueTime",
      "futureFeatures",
    ];

    featureCards.forEach((card, index) => {
      if (index < features.length) {
        const featureKey = features[index];
        const titleElement = card.querySelector("h3");
        const descElement = card.querySelector("p");

        if (titleElement) {
          const title = this.getNestedValue(
            this.translations,
            `welcomepage.features.${featureKey}.title`
          );
          if (title) titleElement.textContent = title;
        }

        if (descElement) {
          const desc = this.getNestedValue(
            this.translations,
            `welcomepage.features.${featureKey}.description`
          );
          if (desc) descElement.textContent = desc;
        }
      }
    });
  }

  /**
   * Traduire les options de select
   */
  translateSelectOptions() {
    // Gender options
    const genderSelect = document.getElementById("welcomepage-gender");
    if (genderSelect) {
      const options = genderSelect.querySelectorAll("option");
      options.forEach((option) => {
        const value = option.value;
        if (value === "") {
          const translation = this.getNestedValue(
            this.translations,
            "welcomepage.auth.signup.genderOptions.select"
          );
          if (translation) option.textContent = translation;
        } else if (value === "male") {
          const translation = this.getNestedValue(
            this.translations,
            "welcomepage.auth.signup.genderOptions.male"
          );
          if (translation) option.textContent = translation;
        } else if (value === "female") {
          const translation = this.getNestedValue(
            this.translations,
            "welcomepage.auth.signup.genderOptions.female"
          );
          if (translation) option.textContent = translation;
        }
      });
    }
  }

  /**
   * Obtenir une traduction avec support de pluralisation
   */
  translate(key, params = {}) {
    let translation = this.getNestedValue(this.translations, key);

    if (!translation && this.fallbackLanguage !== this.currentLanguage) {
      // Fallback vers anglais (contenu HTML original)
      return key;
    }

    if (!translation) return key;

    // Gestion de la pluralisation
    if (
      typeof translation === "object" &&
      translation.singular &&
      translation.plural
    ) {
      const count = params.count || 0;
      translation = count <= 1 ? translation.singular : translation.plural;
    }

    // Remplacement des paramètres
    if (params && typeof translation === "string") {
      Object.keys(params).forEach((param) => {
        const placeholder = `{${param}}`;
        translation = translation.replace(
          new RegExp(placeholder, "g"),
          params[param]
        );
      });
    }

    return translation;
  }

  /**
   * Obtenir un message d'erreur/succès/confirmation
   */
  getMessage(key, params = {}) {
    const message = this.getNestedValue(this.messages, key);
    if (!message) return key;

    // Remplacement des paramètres
    if (params && typeof message === "string") {
      Object.keys(params).forEach((param) => {
        const placeholder = `{${param}}`;
        message = message.replace(new RegExp(placeholder, "g"), params[param]);
      });
    }

    return message;
  }

  /**
   * Obtenir une valeur imbriquée dans un objet
   */
  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Mettre à jour l'état des boutons de langue
   */
  updateLanguageButtons() {
    const langButtons = document.querySelectorAll(".lang-btn");
    langButtons.forEach((btn) => {
      const lang = btn.getAttribute("data-lang");
      btn.classList.toggle("active", lang === this.currentLanguage);
    });
  }

  /**
   * Sauvegarder la langue dans localStorage
   */
  storeLanguage(language) {
    localStorage.setItem("talibhub_language", language);
  }

  /**
   * Récupérer la langue depuis localStorage
   */
  getStoredLanguage() {
    return localStorage.getItem("talibhub_language");
  }

  /**
   * Lier les événements
   */
  bindEvents() {
    // Écouter les clics sur les boutons de langue
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("lang-btn")) {
        const language = e.target.getAttribute("data-lang");
        if (language) {
          this.changeLanguage(language);
        }
      }
    });

    // Observer les changements du DOM pour les éléments dynamiques
    this.observeDOMChanges();
  }

  /**
   * Observer les changements du DOM
   */
  observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      if (this.currentLanguage !== "en" && this.initialized) {
        let shouldTranslate = false;

        mutations.forEach((mutation) => {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Vérifier si le nouvel élément nécessite une traduction
                if (
                  node.querySelector &&
                  (node.querySelector("[data-translate]") ||
                    node.matches("[data-translate]"))
                ) {
                  shouldTranslate = true;
                }
              }
            });
          }
        });

        if (shouldTranslate) {
          // Délai pour permettre au contenu de se stabiliser
          setTimeout(() => {
            this.applyByDataAttributes();
          }, 100);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Méthodes publiques pour compatibilité avec l'ancien système
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  isInitialized() {
    return this.initialized;
  }
}

// Créer et initialiser le gestionnaire global
const translationManager = new AdvancedTranslationManager();

// Initialiser au chargement du DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    translationManager.init();
  });
} else {
  translationManager.init();
}

// Export pour les modules ES6
export default translationManager;

// Export global pour compatibilité
window.translationManager = translationManager;
