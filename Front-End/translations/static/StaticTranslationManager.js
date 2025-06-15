/**
 * Gestionnaire des traductions statiques (UI et contenu du site)
 * Gère les éléments fixes de l'interface et les messages du contenu
 */
class StaticTranslationManager {
  constructor() {
    this.currentLanguage = null; // Pas d'initialisation par défaut
    this.translations = {};
    this.uiTranslations = {};
    this.contentTranslations = {};
    this.fallbackLanguage = "fr"; // Fallback seulement en cas d'erreur
  }

  /**
   * Initialise le gestionnaire avec les traductions
   */
  async init() {
    try {
      // Ne pas charger automatiquement - attendre setLanguage() du manager principal
      console.log(
        "✅ StaticTranslationManager initialisé (en attente de langue)"
      );
    } catch (error) {
      console.error(
        "❌ Erreur d'initialisation StaticTranslationManager:",
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
      this.updateDOM();
    }
  }

  /**
   * Charge les traductions pour une langue
   */
  async loadLanguage(language) {
    try {
      // Charger uniquement les traductions UI (les messages de contenu ont été supprimés)
      const uiResponse = await fetch(
        `./translations/static/ui.${language}.json`
      );

      if (!uiResponse.ok) {
        console.error(
          `❌ Échec chargement ui.${language}.json: ${uiResponse.status}`
        );
        throw new Error(
          `Impossible de charger ui.${language}.json: ${uiResponse.status}`
        );
      }

      this.uiTranslations = await uiResponse.json();

      // Plus de traductions de contenu séparées - tout est dans UI maintenant
      this.contentTranslations = {};

      // Les traductions sont uniquement les traductions UI
      this.translations = {
        ...this.uiTranslations,
      };

      console.log(`📄 Traductions statiques chargées pour ${language}`);
    } catch (error) {
      console.error(`❌ Erreur chargement traductions ${language}:`, error);

      // Fallback vers la langue par défaut si différente
      if (language !== this.fallbackLanguage) {
        console.log(`🔄 Fallback vers ${this.fallbackLanguage}`);
        await this.loadLanguage(this.fallbackLanguage);
      } else {
        // Si même le fallback échoue, initialiser des traductions vides pour éviter les erreurs
        console.warn("⚠️ Échec du fallback - utilisation de traductions vides");
        this.translations = {};
        this.uiTranslations = {};
        this.contentTranslations = {};
      }
    }
  }

  /**
   * Traduit une clé
   */
  translate(key, defaultValue = key) {
    const value = this.getNestedValue(this.translations, key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Alias pour translate()
   */
  t(key, defaultValue = key) {
    return this.translate(key, defaultValue);
  }

  /**
   * Traduit avec variables dynamiques
   */
  translateDynamic(key, variables = {}, defaultValue = key) {
    let translation = this.translate(key, defaultValue);

    // Remplacer les variables
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
   * Met à jour le DOM avec les nouvelles traductions
   */
  updateDOM() {
    // Mettre à jour les éléments avec data-translate
    const elementsToTranslate = document.querySelectorAll("[data-translate]");
    elementsToTranslate.forEach((element) => {
      const key = element.getAttribute("data-translate");
      element.textContent = this.translate(key);
    });

    // Mettre à jour les placeholders
    const elementsWithPlaceholder = document.querySelectorAll(
      "[data-translate-placeholder]"
    );
    elementsWithPlaceholder.forEach((element) => {
      const key = element.getAttribute("data-translate-placeholder");
      element.placeholder = this.translate(key);
    });

    console.log("🔄 DOM mis à jour avec les traductions statiques");
  }

  /**
   * Récupère une valeur imbriquée depuis un objet
   */
  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
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
}

export { StaticTranslationManager };
