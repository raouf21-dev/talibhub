/**
 * Gestionnaire principal des traductions TalibHub
 * Coordonne les traductions statiques et dynamiques
 */
import { StaticTranslationManager } from "./static/StaticTranslationManager.js";
import { NotificationTranslationManager } from "./dynamic/NotificationTranslationManager.js";

class TranslationManager {
  constructor() {
    this.currentLanguage = null; // Pas d'initialisation par défaut
    this.staticManager = new StaticTranslationManager();
    this.notificationManager = new NotificationTranslationManager();
    this.changeListeners = [];
  }

  /**
   * Initialise le gestionnaire principal
   */
  async init() {
    try {
      console.log("🚀 Initialisation du TranslationManager...");

      // Initialiser les gestionnaires (sans langue par défaut)
      console.log("📚 Initialisation des gestionnaires de traductions...");
      await this.staticManager.init();
      await this.notificationManager.init();

      // Détecter la langue à utiliser
      let detectedLanguage = this.detectLanguage();
      console.log(`🌐 Langue détectée: ${detectedLanguage}`);

      // Définir la langue détectée
      console.log(`🔧 Application de la langue: ${detectedLanguage}`);
      await this.setLanguage(detectedLanguage);

      // Configurer les boutons de langue
      console.log("🔘 Configuration des boutons de langue...");
      this.setupLanguageButtons();

      console.log("✅ TranslationManager principal initialisé");
    } catch (error) {
      console.error("❌ Erreur d'initialisation TranslationManager:", error);
      // S'assurer que l'application continue de fonctionner même si les traductions échouent
      console.warn("⚠️ L'application va continuer sans traductions complètes");

      // Définir une langue par défaut même en cas d'erreur
      this.currentLanguage = this.currentLanguage || "fr";
    }
  }

  /**
   * Détecte la langue à utiliser selon les préférences
   */
  detectLanguage() {
    // 1. Vérifier localStorage (préférence utilisateur sauvegardée)
    let savedLanguage = localStorage.getItem("userLang");
    if (savedLanguage && (savedLanguage === "fr" || savedLanguage === "en")) {
      console.log(`💾 Langue récupérée du localStorage: ${savedLanguage}`);
      return savedLanguage;
    }

    // 2. Détecter la langue du navigateur
    const browserLang = navigator.language || navigator.userLanguage;
    const detectedLang = browserLang.toLowerCase();

    let selectedLanguage;
    if (detectedLang.startsWith("fr")) {
      selectedLanguage = "fr";
    } else {
      selectedLanguage = "en"; // Par défaut anglais
    }

    // Sauvegarder la détection pour la prochaine fois
    localStorage.setItem("userLang", selectedLanguage);
    console.log(
      `🌐 Langue détectée automatiquement: ${selectedLanguage} (navigateur: ${browserLang})`
    );

    return selectedLanguage;
  }

  /**
   * Change la langue pour tous les gestionnaires
   */
  async setLanguage(language) {
    if (this.currentLanguage !== language) {
      this.currentLanguage = language;

      // Sauvegarder la préférence
      localStorage.setItem("userLang", language);

      // Mettre à jour les gestionnaires avec gestion d'erreurs robuste
      try {
        await Promise.all([
          this.staticManager.setLanguage(language),
          this.notificationManager.setLanguage(language),
        ]);
        console.log(`🌍 Langue changée vers: ${language}`);
      } catch (error) {
        console.error(
          `❌ Erreur lors du changement de langue vers ${language}:`,
          error
        );
        // Continuer malgré l'erreur pour ne pas bloquer l'application
      }

      // Notifier les listeners même en cas d'erreur de chargement
      this.notifyLanguageChange();
    }
  }

  /**
   * Ajoute un listener pour les changements de langue
   */
  onLanguageChange(callback) {
    this.changeListeners.push(callback);
  }

  /**
   * Notifie tous les listeners du changement de langue
   */
  notifyLanguageChange() {
    // Notifier via callbacks internes
    this.changeListeners.forEach((callback) => {
      try {
        callback(this.currentLanguage);
      } catch (error) {
        console.error(
          "❌ Erreur dans listener de changement de langue:",
          error
        );
      }
    });

    // Émettre l'événement DOM pour compatibilité avec les anciens composants
    const languageEvent = new CustomEvent("languageChanged", {
      detail: { language: this.currentLanguage },
    });
    document.dispatchEvent(languageEvent);
    console.log(`📢 Événement languageChanged émis: ${this.currentLanguage}`);
  }

  /**
   * MÉTHODES POUR TRADUCTIONS STATIQUES (UI + Contenu)
   */

  /**
   * Traduit du contenu statique (UI, labels, etc.)
   */
  translate(key, defaultValue = key) {
    return this.staticManager.translate(key, defaultValue);
  }

  /**
   * Alias pour translate()
   */
  t(key, defaultValue = key) {
    return this.translate(key, defaultValue);
  }

  /**
   * Traduit avec variables dynamiques (pour le contenu statique)
   */
  translateDynamic(key, variables = {}, defaultValue = key) {
    return this.staticManager.translateDynamic(key, variables, defaultValue);
  }

  /**
   * MÉTHODES POUR NOTIFICATIONS DYNAMIQUES
   */

  /**
   * Traduit une notification
   */
  translateNotification(key, variables = {}, defaultValue = key) {
    return this.notificationManager.translate(key, variables, defaultValue);
  }

  /**
   * Alias pour translateNotification()
   */
  tn(key, variables = {}, defaultValue = key) {
    return this.translateNotification(key, variables, defaultValue);
  }

  /**
   * Traduit un message de succès
   */
  success(key, variables = {}) {
    return this.notificationManager.success(key, variables);
  }

  /**
   * Traduit un message d'erreur
   */
  error(key, variables = {}) {
    return this.notificationManager.error(key, variables);
  }

  /**
   * Traduit un message d'information
   */
  info(key, variables = {}) {
    return this.notificationManager.info(key, variables);
  }

  /**
   * Traduit un message d'avertissement
   */
  warning(key, variables = {}) {
    return this.notificationManager.warning(key, variables);
  }

  /**
   * MÉTHODES UTILITAIRES
   */

  /**
   * Retourne la langue courante
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Vérifie si une clé statique existe
   */
  hasStaticTranslation(key) {
    return this.staticManager.hasTranslation(key);
  }

  /**
   * Vérifie si une clé de notification existe
   */
  hasNotificationTranslation(key) {
    return this.notificationManager.hasTranslation(key);
  }

  /**
   * Retourne toutes les traductions pour debug
   */
  getAllTranslations() {
    return {
      static: this.staticManager.getAllTranslations(),
      notifications: this.notificationManager.getAllTranslations(),
    };
  }

  /**
   * Force la mise à jour du DOM (pour les traductions statiques)
   */
  updateDOM() {
    this.staticManager.updateDOM();
  }

  /**
   * Force le rechargement des traductions (utile après mise à jour des JSON)
   */
  async forceReload() {
    console.log("🔄 Rechargement forcé des traductions...");
    await this.staticManager.loadLanguage(this.currentLanguage);
    await this.notificationManager.loadLanguage(this.currentLanguage);
    this.updateDOM();
    this.notifyLanguageChange();
    console.log("✅ Rechargement terminé");
  }

  /**
   * Configure les boutons de changement de langue
   */
  setupLanguageButtons() {
    // Attendre que le DOM soit chargé
    const setupButtons = () => {
      const langButtons = document.querySelectorAll(".lang-btn");

      if (langButtons.length === 0) {
        console.log("⚠️ Aucun bouton de langue trouvé (.lang-btn)");
        return;
      }

      console.log(
        `🔘 Configuration de ${langButtons.length} boutons de langue`
      );

      langButtons.forEach((button) => {
        // Nettoyer les anciens listeners pour éviter les doublons
        button.removeEventListener("click", this.handleLanguageButtonClick);

        // Ajouter le nouveau listener
        button.addEventListener("click", (e) => {
          e.preventDefault();
          const selectedLang = button.getAttribute("data-lang");

          if (selectedLang) {
            console.log(
              `🔄 Changement langue: ${this.currentLanguage} → ${selectedLang}`
            );
            this.setLanguage(selectedLang);

            // Marquer le bouton comme actif
            this.updateActiveLanguageButton(selectedLang);
          }
        });
      });

      // Marquer le bouton actuel comme actif immédiatement
      this.updateActiveLanguageButton(this.currentLanguage);
    };

    // Si le DOM est déjà chargé, configurer immédiatement
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupButtons);
    } else {
      setupButtons();
    }
  }

  /**
   * Met à jour l'état visuel des boutons de langue
   */
  updateActiveLanguageButton(selectedLang) {
    const langButtons = document.querySelectorAll(".lang-btn");
    langButtons.forEach((button) => {
      if (button.getAttribute("data-lang") === selectedLang) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }
}

// Instance globale
const translationManager = new TranslationManager();

// Export pour utilisation dans d'autres modules
export { TranslationManager, translationManager };

// Rendre disponible globalement (pour compatibilité)
if (typeof window !== "undefined") {
  window.translationManager = translationManager;
}
