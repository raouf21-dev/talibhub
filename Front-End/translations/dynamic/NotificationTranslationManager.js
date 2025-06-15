/**
 * Gestionnaire des notifications dynamiques et messages popup
 * Gère les notifications temporaires, alertes et messages utilisateur
 */
class NotificationTranslationManager {
  constructor() {
    this.currentLanguage = null; // Pas d'initialisation par défaut
    this.translations = {};
    this.fallbackLanguage = "fr"; // Fallback seulement en cas d'erreur
  }

  /**
   * Initialise le gestionnaire avec les traductions
   */
  async init() {
    try {
      // Ne pas charger automatiquement - attendre setLanguage() du manager principal
      console.log(
        "✅ NotificationTranslationManager initialisé (en attente de langue)"
      );
    } catch (error) {
      console.error(
        "❌ Erreur d'initialisation NotificationTranslationManager:",
        error
      );
    }
  }

  /**
   * Change la langue courante
   */
  async setLanguage(language) {
    if (this.currentLanguage !== language) {
      this.currentLanguage = language;
      await this.loadLanguage(language);
    }
  }

  /**
   * Charge les traductions pour une langue
   */
  async loadLanguage(language) {
    try {
      const response = await fetch(
        `./translations/dynamic/notifications.${language}.json`
      );

      if (!response.ok) {
        console.error(
          `❌ Échec chargement notifications.${language}.json: ${response.status}`
        );
        throw new Error(
          `Impossible de charger notifications.${language}.json: ${response.status}`
        );
      }

      this.translations = await response.json();
      console.log(`🔔 Notifications dynamiques chargées pour ${language}`);
    } catch (error) {
      console.error(`❌ Erreur chargement notifications ${language}:`, error);

      // Fallback vers la langue par défaut si différente
      if (language !== this.fallbackLanguage) {
        console.log(`🔄 Fallback vers ${this.fallbackLanguage}`);
        await this.loadLanguage(this.fallbackLanguage);
      } else {
        // Si même le fallback échoue, initialiser des traductions vides pour éviter les erreurs
        console.warn("⚠️ Échec du fallback - utilisation de traductions vides");
        this.translations = {};
      }
    }
  }

  /**
   * Traduit une notification avec variables
   */
  translate(key, variables = {}, defaultValue = key) {
    let translation = this.getNestedValue(this.translations, key);

    if (translation === undefined) {
      translation = defaultValue;
    }

    // Remplacer les variables dynamiques
    Object.keys(variables).forEach((varKey) => {
      const placeholder = `{${varKey}}`;
      translation = translation.replace(
        new RegExp(placeholder, "g"),
        variables[varKey]
      );
    });

    return translation;
  }

  /**
   * Alias pour translate()
   */
  t(key, variables = {}, defaultValue = key) {
    return this.translate(key, variables, defaultValue);
  }

  /**
   * Récupère une valeur imbriquée depuis un objet
   */
  getNestedValue(obj, path) {
    const keys = path.split(".");
    return keys.reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Vérifie si une clé de traduction existe
   */
  hasTranslation(key) {
    return this.getNestedValue(this.translations, key) !== undefined;
  }

  /**
   * Retourne toutes les traductions pour debug
   */
  getAllTranslations() {
    return this.translations;
  }

  /**
   * Retourne la langue courante
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Méthodes spécifiques aux notifications
   */

  /**
   * Traduit un message de succès
   */
  success(key, variables = {}) {
    return this.translate(key, variables);
  }

  /**
   * Traduit un message d'erreur
   */
  error(key, variables = {}) {
    return this.translate(key, variables);
  }

  /**
   * Traduit un message d'information
   */
  info(key, variables = {}) {
    return this.translate(key, variables);
  }

  /**
   * Traduit un message d'avertissement
   */
  warning(key, variables = {}) {
    return this.translate(key, variables);
  }
}

export { NotificationTranslationManager };
