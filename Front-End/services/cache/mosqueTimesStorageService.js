// Service pour centraliser le stockage des horaires de mosquées
import CacheService, { getMidnightTimestamp } from "./cacheService.js";
import { getCurrentDateString } from "../utils/mosqueTimeUtils.js";

const mosqueTimesStorageService = {
  // Préfixe pour toutes les clés de cache liées aux mosquées
  KEY_PREFIX: "mosque_times_",

  // Clé pour les données de villes
  CITIES_KEY: "mosque_times_cities",

  // Clé pour stocker la dernière ville sélectionnée
  LAST_CITY_KEY: "lastSelectedCity",

  /**
   * Génère une clé de cache unique pour une ville
   * @param {string} cityName - Nom de la ville
   * @returns {string} - Clé unique formatée
   */
  getCityKey(cityName) {
    const normalizedCity = this.normalizeCity(cityName);
    return `${this.KEY_PREFIX}city_${normalizedCity}`;
  },

  /**
   * Normalise le nom d'une ville pour le stockage
   * @param {string} cityName - Nom de la ville à normaliser
   * @returns {string} - Nom normalisé
   */
  normalizeCity(cityName) {
    return cityName ? cityName.toLowerCase().trim() : "";
  },

  /**
   * Récupère les données d'une ville depuis le cache
   * @param {string} cityName - Nom de la ville
   * @returns {Object|null} - Données de la ville ou null si non trouvées/expirées
   */
  getCityData(cityName) {
    try {
      const cacheKey = this.getCityKey(cityName);
      console.log(
        `[DEBUG] mosqueTimesStorageService: getCityData pour ${cityName}, clé: ${cacheKey}`
      );

      const cachedData = CacheService.getItem(cacheKey);

      if (cachedData) {
        console.log(
          `[DEBUG] mosqueTimesStorageService: Données trouvées dans le cache`,
          cachedData
        );
        return cachedData;
      } else {
        console.log(
          `[DEBUG] mosqueTimesStorageService: Aucune donnée dans le cache pour ${cityName}`
        );
        return null;
      }
    } catch (error) {
      console.error(
        "[DEBUG] mosqueTimesStorageService: Erreur lors de la récupération:",
        error
      );
      return null;
    }
  },

  /**
   * Sauvegarde les données d'une ville dans le cache
   * @param {string} cityName - Nom de la ville
   * @param {Object} data - Données à sauvegarder
   * @returns {boolean} - Succès ou échec
   */
  saveCityData(cityName, data) {
    try {
      const cacheKey = this.getCityKey(cityName);
      console.log(
        `[DEBUG] mosqueTimesStorageService: Sauvegarde pour ${cityName}, clé: ${cacheKey}`
      );

      // Stockage avec expiration à minuit
      CacheService.setItem(cacheKey, data, getMidnightTimestamp());

      // Mémoriser cette ville dans la liste des villes mises en cache
      this.addCityToList(cityName);

      console.log(
        `[DEBUG] mosqueTimesStorageService: Données stockées avec succès`
      );
      return true;
    } catch (error) {
      console.error(
        "[DEBUG] mosqueTimesStorageService: Erreur lors du stockage:",
        error
      );
      return false;
    }
  },

  /**
   * Ajoute une ville à la liste des villes mises en cache
   * @param {string} cityName - Nom de la ville
   */
  addCityToList(cityName) {
    const normalizedCity = this.normalizeCity(cityName);
    const cities = this.getCachedCities();

    if (!cities.includes(normalizedCity)) {
      cities.push(normalizedCity);
      CacheService.setItem(this.CITIES_KEY, cities, getMidnightTimestamp());
    }
  },

  /**
   * Récupère la liste des villes mises en cache
   * @returns {Array} - Liste des noms de villes
   */
  getCachedCities() {
    return CacheService.getItem(this.CITIES_KEY) || [];
  },

  /**
   * Enregistre la dernière ville sélectionnée
   * @param {string} cityName - Nom de la ville
   */
  saveLastSelectedCity(cityName) {
    if (cityName) {
      localStorage.setItem(this.LAST_CITY_KEY, cityName);
    }
  },

  /**
   * Récupère la dernière ville sélectionnée
   * @returns {string|null} - Nom de la dernière ville ou null
   */
  getLastSelectedCity() {
    return localStorage.getItem(this.LAST_CITY_KEY);
  },

  /**
   * Vérifie la version actuelle et nettoie les données si nécessaire
   * @param {string} version - Version actuelle de l'application
   * @returns {boolean} - Indique si un nettoyage a été effectué
   */
  checkVersionAndCleanup(version) {
    const storedVersion = localStorage.getItem("app_version");

    if (storedVersion !== version) {
      console.log(
        `Nouvelle version détectée (${version}). Nettoyage des données.`
      );
      this.clearAllData();
      localStorage.setItem("app_version", version);
      return true; // Indique qu'une mise à jour a été effectuée
    }

    return false; // Aucune mise à jour nécessaire
  },

  /**
   * Efface toutes les données de cache liées aux mosquées
   * @returns {boolean} - Succès ou échec
   */
  clearAllData() {
    try {
      // Supprimer toutes les villes mises en cache
      const cities = this.getCachedCities();
      cities.forEach((city) => {
        const key = this.getCityKey(city);
        CacheService.removeItem(key);
        console.log(`[DEBUG] mosqueTimesStorageService: Suppression de ${key}`);
      });

      // Supprimer la liste des villes
      CacheService.removeItem(this.CITIES_KEY);

      // Supprimer la dernière ville sélectionnée
      localStorage.removeItem(this.LAST_CITY_KEY);

      console.log(
        "[DEBUG] mosqueTimesStorageService: Toutes les données ont été effacées"
      );
      return true;
    } catch (error) {
      console.error(
        "[DEBUG] mosqueTimesStorageService: Erreur lors du nettoyage:",
        error
      );
      return false;
    }
  },

  /**
   * Efface les données de cache pour une ville spécifique
   * @param {string} cityName - Nom de la ville
   * @returns {boolean} - Succès ou échec
   */
  clearCityData(cityName) {
    try {
      const normalizedCity = this.normalizeCity(cityName);
      const cacheKey = this.getCityKey(normalizedCity);

      // Supprimer les données de la ville
      CacheService.removeItem(cacheKey);

      // Supprimer la ville de la liste des villes mises en cache
      const cities = this.getCachedCities();
      const updatedCities = cities.filter((city) => city !== normalizedCity);

      if (updatedCities.length !== cities.length) {
        CacheService.setItem(
          this.CITIES_KEY,
          updatedCities,
          getMidnightTimestamp()
        );
      }

      console.log(
        `[DEBUG] mosqueTimesStorageService: Données de ${cityName} supprimées du cache`
      );
      return true;
    } catch (error) {
      console.error(
        `[DEBUG] mosqueTimesStorageService: Erreur lors de la suppression des données de ${cityName}:`,
        error
      );
      return false;
    }
  },
};

export default mosqueTimesStorageService;
