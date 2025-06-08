// cacheCountries.js - Service de cache pour les pays
// Utilise le service de cache unifié

import CacheService from "./cacheService.js";

const COUNTRIES_CACHE_KEY = "countries_list";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

export const countriesCache = {
  /**
   * Récupère la liste des pays depuis le cache ou l'API
   * @param {string} lang - Code de langue (fr, en)
   * @returns {Promise<Array>} Liste des pays
   */
  async getCountries(lang = "fr") {
    const cacheKey = `${COUNTRIES_CACHE_KEY}_${lang}`;

    // Vérifier le cache d'abord
    const cached = CacheService.get(cacheKey);
    if (cached) {
      console.log(
        `[COUNTRIES] Données récupérées depuis le cache pour ${lang}`
      );
      return cached;
    }

    try {
      // Appel API pour récupérer les pays
      const response = await fetch(`/api/countries?lang=${lang}`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const countries = await response.json();

      // Mettre en cache
      CacheService.set(cacheKey, countries, CACHE_DURATION);
      console.log(
        `[COUNTRIES] Données mises en cache pour ${lang}, ${countries.length} pays`
      );

      return countries;
    } catch (error) {
      console.error(
        `[COUNTRIES] Erreur lors de la récupération des pays:`,
        error
      );

      // Retourner une liste par défaut en cas d'erreur
      return this.getDefaultCountries(lang);
    }
  },

  /**
   * Liste par défaut des pays les plus courants
   * @param {string} lang - Code de langue
   * @returns {Array} Liste des pays par défaut
   */
  getDefaultCountries(lang = "fr") {
    const countries =
      lang === "fr"
        ? [
            "France",
            "Belgique",
            "Suisse",
            "Canada",
            "Maroc",
            "Algérie",
            "Tunisie",
            "Sénégal",
            "Côte d'Ivoire",
            "Mali",
            "Burkina Faso",
            "Niger",
            "Tchad",
            "République démocratique du Congo",
            "Madagascar",
            "Cameroun",
            "Liban",
            "Égypte",
            "Arabie Saoudite",
            "Émirats arabes unis",
            "Qatar",
            "Koweït",
            "Bahreïn",
            "Oman",
            "Jordanie",
            "Palestine",
            "Syrie",
            "Irak",
            "Iran",
            "Afghanistan",
            "Pakistan",
            "Bangladesh",
            "Indonésie",
            "Malaisie",
            "Brunei",
            "Turquie",
            "Azerbaïdjan",
            "Kazakhstan",
            "Kirghizistan",
            "Ouzbékistan",
            "Tadjikistan",
            "Turkménistan",
            "Albanie",
            "Bosnie-Herzégovine",
            "Kosovo",
            "Macédoine du Nord",
            "Monténégro",
            "Royaume-Uni",
            "Allemagne",
            "Pays-Bas",
            "Italie",
            "Espagne",
            "Suède",
            "Norvège",
            "Danemark",
            "États-Unis",
            "Australie",
            "Nouvelle-Zélande",
          ]
        : [
            "France",
            "Belgium",
            "Switzerland",
            "Canada",
            "Morocco",
            "Algeria",
            "Tunisia",
            "Senegal",
            "Ivory Coast",
            "Mali",
            "Burkina Faso",
            "Niger",
            "Chad",
            "Democratic Republic of Congo",
            "Madagascar",
            "Cameroon",
            "Lebanon",
            "Egypt",
            "Saudi Arabia",
            "United Arab Emirates",
            "Qatar",
            "Kuwait",
            "Bahrain",
            "Oman",
            "Jordan",
            "Palestine",
            "Syria",
            "Iraq",
            "Iran",
            "Afghanistan",
            "Pakistan",
            "Bangladesh",
            "Indonesia",
            "Malaysia",
            "Brunei",
            "Turkey",
            "Azerbaijan",
            "Kazakhstan",
            "Kyrgyzstan",
            "Uzbekistan",
            "Tajikistan",
            "Turkmenistan",
            "Albania",
            "Bosnia and Herzegovina",
            "Kosovo",
            "North Macedonia",
            "Montenegro",
            "United Kingdom",
            "Germany",
            "Netherlands",
            "Italy",
            "Spain",
            "Sweden",
            "Norway",
            "Denmark",
            "United States",
            "Australia",
            "New Zealand",
          ];

    return countries.map((name) => ({
      name,
      code: name.toLowerCase().replace(/\s+/g, "_"),
    }));
  },

  /**
   * Vide le cache des pays
   */
  clear() {
    CacheService.remove(COUNTRIES_CACHE_KEY + "_fr");
    CacheService.remove(COUNTRIES_CACHE_KEY + "_en");
    console.log("[COUNTRIES] Cache vidé");
  },
};
