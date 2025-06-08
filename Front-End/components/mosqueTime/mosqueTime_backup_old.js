import { notificationService } from "../../services/notifications/notificationService.js";
import { api } from "../../services/api/dynamicLoader.js";
import CacheService, {
  getMidnightTimestamp,
} from "../../services/cache/cacheService.js";
import { API_BASE_URL } from "../../config/apiConfig.js";
import mosqueTimesStorageService from "../../services/cache/mosqueTimesStorageService.js";
import {
  formatPrayerTime,
  createMapsLink,
  createNavigationIconSVG,
  formatPrayerTimesHTML,
  getCurrentDateString,
  calculateDistance,
  toRad,
} from "../../services/utils/mosqueTimeUtils.js";

export class MosqueTimeManager {
  constructor(options = {}) {
    console.log("MosqueTimeManager: Constructor called with options:", options);

    // Configuration générale
    this.isWelcomePage = options.isWelcomePage || false;
    this.container = options.container || this.getDefaultContainer();
    this.apiBaseUrl = API_BASE_URL;
    this.cachePrefix = this.isWelcomePage ? "public_" : "";

    // Variables principales
    this.currentMosques = [];
    this.selectedCity = null;
    this.sortOrder = "asc";
    this.lastDate = null;
    this.currentDate = new Date();

    // Variables spécifiques au scraping automatique
    this.waitRequest = null;

    // Déterminer la langue actuelle
    this.currentLang =
      localStorage.getItem(this.isWelcomePage ? "language" : "userLang") ||
      "en";

    // Définir les textes selon la langue
    this.texts = this.getLocalizedTexts();

    // Écouter les changements de langue
    const languageEventHandler = (event) => {
      this.currentLang = event.detail.language || event.detail.lang;
      this.texts = this.getLocalizedTexts();
      if (this.isWelcomePage) {
        this.updateInterface();
      } else {
        this.updateDateDisplay();
        this.populateMosqueSelect(this.currentMosques);
        const mosqueSelect = document.getElementById(
          "mosquetime-mosque-select"
        );
        if (mosqueSelect && !mosqueSelect.value) {
          this.updateSingleMosqueTimes();
        }
      }
    };

    window.addEventListener("languageChanged", languageEventHandler);
    document.addEventListener("languageChanged", languageEventHandler);

    // Écouter les événements de fin de scraping pour auto-refresh
    this.setupScrapingEventListeners();

    // Interface spécifique selon le mode
    if (this.isWelcomePage) {
      this.updateInterface();
    }

    console.log("MosqueTimeManager: Constructor completed");
  }

  // Méthode pour obtenir le container par défaut
  getDefaultContainer() {
    if (this.isWelcomePage) {
      return document.getElementById("welcomepage-mosque-time");
    } else {
      return (
        document.querySelector("#mosquetime .mosquetime-content") ||
        document.getElementById("mosquetime")
      );
    }
  }

  // Méthode pour obtenir les textes localisés
  getLocalizedTexts() {
    const lang = this.currentLang;
    const texts = {
      en: {
        title: "Congregational Prayer Times at the Mosque",
        subtitle: "Find congregational prayer times in mosques near you",
        useLocation: "Use my location",
        selectCity: "Select a city",
        search: "Search",
        loading: "Loading prayer times, please wait...",
        singleMosque: "Single Mosque",
        allMosques: "All Mosques",
        selectMosque: "Select a mosque",
        sortAZ: "A to Z",
        sortZA: "Z to A",
        sortNearest: "Nearest",
        disclaimer:
          "These times correspond to congregational prayers at the mosque and may differ from individual prayer times.",
        prayerNotAvailable: "Prayer times not available",
        pleaseSelectMosque: "Please select a mosque",
        authRequired: "Authentication Required",
        authRequiredDescription:
          "Please log in to view mosque prayer times for this city.",
        loginButton: "Log In",
        scrapingInProgress: "Scraping in progress...",
        scrapingCompleted: "Scraping completed",
        scrapingBackground: "Scraping in background",
        scrapingFailed: "Scraping failed",
        scrapingError: "Scraping error",
        selectMosqueToView: "Please select a mosque to view prayer times",
        noMosqueFound: "No mosque found",
        dateTitle: "Prayer times for",
      },
      fr: {
        title: "Horaires de Prière en Congrégation à la Mosquée",
        subtitle:
          "Trouvez les horaires des prières en congrégation dans les mosquées près de chez vous",
        useLocation: "Utiliser ma localisation",
        selectCity: "Sélectionnez une ville",
        search: "Rechercher",
        loading: "Chargement des horaires de prière, veuillez patienter...",
        singleMosque: "Mosquée Unique",
        allMosques: "Toutes les Mosquées",
        selectMosque: "Sélectionnez une mosquée",
        sortAZ: "A à Z",
        sortZA: "Z à A",
        sortNearest: "Les Plus Proches",
        disclaimer:
          "Ces horaires correspondent aux prières en congrégation à la mosquée et peuvent différer des horaires de prières individuels.",
        prayerNotAvailable: "Horaires non disponibles",
        pleaseSelectMosque: "Veuillez sélectionner une mosquée",
        authRequired: "Authentification Requise",
        authRequiredDescription:
          "Veuillez vous connecter pour voir les horaires des mosquées pour cette ville.",
        loginButton: "Se Connecter",
        scrapingInProgress: "Scraping en cours...",
        scrapingCompleted: "Scraping terminé",
        scrapingBackground: "Scraping en arrière-plan",
        scrapingFailed: "Scraping échoué",
        scrapingError: "Erreur de scraping",
        selectMosqueToView:
          "Veuillez sélectionner une mosquée pour voir ses horaires de prière",
        noMosqueFound: "Aucune mosquée trouvée",
        dateTitle: "Horaires pour le",
      },
    };

    return texts[lang] || texts.en;
  }

  // --- Point d'entrée principal ---
  async initialize() {
    try {
      console.log("MosqueTimeManager: Initializing...");

      if (!this.container) {
        console.error("MosqueTimeManager: Container not found");
        return;
      }

      // Setup selon le mode
      if (this.isWelcomePage) {
        console.log("MosqueTimeManager: Setting up Welcome mode");
        this.updateInterface();
      } else {
        console.log("MosqueTimeManager: Setting up Authenticated mode");
        this.updateDateDisplay();
        this.addCustomStyles();
      }

      // Setup event listeners
      console.log("MosqueTimeManager: Setting up event listeners");
      this.setupEventListeners();

      // Setup scraping event listeners
      console.log("MosqueTimeManager: Setting up scraping event listeners");
      this.setupScrapingEventListeners();

      // Load cities FIRST so getCurrentCity() works during refresh
      console.log("MosqueTimeManager: Loading cities");
      await this.loadCities();

      // Vérifier d'abord si des données existent pour aujourd'hui
      console.log("MosqueTimeManager: Checking for today's data in DB");
      await this.checkAndUpdateData();

      // Vérifier l'intégrité des données locales
      console.log("MosqueTimeManager: Checking data integrity");
      await this.checkAndFixDataIntegrity();

      // Setup spécifique selon le mode
      if (this.isWelcomePage) {
        // Sélectionner l'onglet "All Mosques" par défaut pour la welcome page
        console.log("MosqueTimeManager: Setting default tab to All Mosques");
        const tabs = document.querySelectorAll(".mosquetime-tab");
        tabs.forEach((tab) => {
          if (tab.dataset.tab === "all") {
            tab.classList.add("active");
          } else {
            tab.classList.remove("active");
          }
        });
        this.switchTab("all");
      } else {
        // Setup pour page authentifiée
        await this.loadLastSelectedCity();
        this.switchTab("all");
      }

      console.log("MosqueTimeManager: Initialization completed");
    } catch (error) {
      if (error.message.includes("token")) {
        window.location.href = "/login";
      }
      console.error("Erreur d'initialisation:", error);
    }
  }

  // Nouvelle méthode pour ajouter les styles personnalisés
  addCustomStyles() {
    if (document.getElementById("mosque-time-custom-styles")) return;

    const styleElement = document.createElement("style");
    styleElement.id = "mosque-time-custom-styles";
    styleElement.textContent = `
      .mosque-info-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        margin-bottom: 0px;
      }
      
      .mosque-text-container {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .mosque-name {
        margin-bottom: 5px;
      }
      
      .mosque-address {
        color: var(--gray-color, #8b8c89);
        font-size: 0.90em;
        display: flex;
        align-items: center;
      }
      
      .mosque-address i {
        margin-right: 5px;
        color: var(--gray-color, #8b8c89);
      }
      
      .mosque-directions-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: #ffffff;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        text-decoration: none;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        padding: 0;
        overflow: hidden;
        margin-left: 15px;
      }
      
      .mosque-directions-link:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
      }
      
      .navigation-icon {
        width: 32px;
        height: 32px;
        object-fit: contain;
      }
    `;
    document.head.appendChild(styleElement);
  }

  // --- Vérification et mise à jour des données si nécessaire ---
  async checkAndUpdateData() {
    try {
      const date = getCurrentDateString();
      console.log("Checking data for date:", date); // Debug log

      const dataExists = await api.get(`/mosque-times/exists/${date}`);
      console.log("Data exists response:", dataExists); // Debug log

      if (!dataExists.exists) {
        console.log("No data found, starting scraping"); // Debug log
        notificationService.show("mosque.data.updating", "info");
        await this.triggerScrapingForAllCities();
        notificationService.show("mosque.data.updated", "success");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des données:", error);
      // Si l'erreur est "Prayer times not found", on devrait lancer le scraping
      if (error.message.includes("Prayer times not found")) {
        console.log("Starting scraping after error"); // Debug log
        try {
          notificationService.show("mosque.data.updating", "info");
          await this.triggerScrapingForAllCities();
          notificationService.show("mosque.data.updated", "success");
        } catch (scrapingError) {
          console.error("Erreur lors du scraping:", scrapingError);
          notificationService.show("mosque.scrape.error", "error", 0);
        }
      } else {
        notificationService.show("mosque.data.error", "error", 0);
      }
    }
  }

  // --- Déclencher le scraping pour toutes les villes ---
  async triggerScrapingForAllCities() {
    console.log("[MOSQUE] triggerScrapingForAllCities - Début");

    try {
      console.log("[MOSQUE] Starting scraping for all cities");

      // Afficher la notification
      notificationService.show("mosque.data.updating", "info");
      console.log("[MOSQUE] Notification 'mosque.data.updating' affichée");

      // Utiliser la version de longRunningRequest qui force l'affichage du loader
      console.log(
        "[MOSQUE] Appel de api.longRunningRequestWithForcedLoader pour scrape-all"
      );
      const result = await api.longRunningRequestWithForcedLoader(
        "/mosque-times/scrape-all",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
        3000
      ); // Augmenter l'intervalle à 3 secondes
      console.log("[MOSQUE] Réponse de longRunningRequest reçue:", result);

      // Si le scraping est terminé avec succès, mettre à jour immédiatement l'interface
      if (result && result.status === "completed" && result.cities) {
        console.log(
          "[MOSQUE] Scraping terminé avec succès, mise à jour des données"
        );

        // Si nous avons une ville sélectionnée, mettre à jour ses données
        if (this.selectedCity && result.cities[this.selectedCity]) {
          console.log(
            "[MOSQUE] Mise à jour des données pour la ville sélectionnée:",
            this.selectedCity
          );
          const cityData = result.cities[this.selectedCity];

          // Formater les données de la même manière que handleCitySelection
          this.currentMosques = cityData.mosques.map((mosque) => {
            const prayerTime = cityData.prayerTimesData.prayerTimes?.find(
              (pt) => String(pt.mosque_id) === String(mosque.id)
            );
            return {
              ...mosque,
              prayerTimes: prayerTime || null,
            };
          });
          console.log(
            "[MOSQUE] Données des mosquées mises à jour:",
            this.currentMosques.length
          );

          // Mettre à jour l'interface
          this.populateMosqueSelect(this.currentMosques);
          console.log("[MOSQUE] Select des mosquées mis à jour");

          // Sauvegarder dans le cache
          mosqueTimesStorageService.saveCityData(this.selectedCity, {
            currentMosques: this.currentMosques,
          });
          console.log("[MOSQUE] Données sauvegardées dans le cache");

          // Mettre à jour l'affichage
          this.updateDisplay();
          console.log("[MOSQUE] Affichage mis à jour");
        }
        // Si pas de ville sélectionnée mais des données disponibles
        else if (Object.keys(result.cities).length > 0) {
          // Sélectionner la première ville disponible
          const firstCity = Object.keys(result.cities)[0];
          console.log(
            "[MOSQUE] Pas de ville sélectionnée, sélection de la première ville disponible:",
            firstCity
          );

          // Attendre que les données soient chargées
          console.log("[MOSQUE] Appel de handleCitySelection pour", firstCity);
          await this.handleCitySelection(firstCity);
          console.log("[MOSQUE] Données chargées pour", firstCity);
        }

        // Montrer une notification de succès
        console.log(
          "[MOSQUE] Statut 'completed' détecté, notification de succès"
        );
        notificationService.show("mosque.data.updated", "success");
        return result;
      } else if (result && result.status === "timeout") {
        console.log(
          "[MOSQUE] Statut 'timeout' détecté, chargement des données existantes après délai"
        );

        // Attendre un peu avant de tenter de récupérer les données
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Essayer de charger les données existantes
        console.log(
          "[MOSQUE] Tentative de récupération des données après timeout"
        );
        try {
          await this.loadLastSelectedCity();
          console.log("[MOSQUE] Données existantes chargées après timeout");
        } catch (e) {
          console.error(
            "[MOSQUE] Échec du chargement des données après timeout:",
            e
          );
        }

        notificationService.show("mosque.data.partial", "warning");
        console.log("[MOSQUE] Notification 'mosque.data.partial' affichée");
        return { success: false, status: "timeout" };
      } else {
        console.warn("[MOSQUE] Résultats de scraping incomplets:", result);
        notificationService.show("mosque.data.partial", "warning");
        console.log("[MOSQUE] Notification 'mosque.data.partial' affichée");

        // Essayer de charger quand même les données
        console.log("[MOSQUE] Tentative de chargement des données existantes");
        await this.loadLastSelectedCity();
        console.log("[MOSQUE] Chargement des données existantes terminé");

        return { success: false };
      }
    } catch (error) {
      console.error("[MOSQUE] Erreur lors du scraping:", error);
      notificationService.show("mosque.scrape.error", "error", 0);
      console.log("[MOSQUE] Notification d'erreur affichée");

      // Essayer de charger quand même les données existantes
      console.log(
        "[MOSQUE] Tentative de chargement des données existantes après erreur"
      );
      await this.loadLastSelectedCity();
      console.log(
        "[MOSQUE] Chargement des données existantes après erreur terminé"
      );

      throw error;
    } finally {
      console.log("[MOSQUE] triggerScrapingForAllCities - Fin");
    }
  }

  // --- Chargement de la liste des villes ---
  async loadCities() {
    try {
      const cities = await api.get("/mosque-times/cities/search?query=");
      this.populateCitySelect(cities);
    } catch (error) {
      console.error("Erreur lors du chargement des villes:", error);
      notificationService.show("mosque.load.error", "error", 0);
    }
  }

  // --- Remplir le select des villes ---
  populateCitySelect(cities) {
    const select = document.getElementById("mosquetime-location-select");
    if (!select) return;

    select.innerHTML = '<option value="">Sélectionnez une ville</option>';
    cities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      select.appendChild(option);
    });
  }

  // --- Charger la dernière ville sélectionnée (si existante) ---
  async loadLastSelectedCity() {
    try {
      const lastCity = mosqueTimesStorageService.getLastSelectedCity();
      if (lastCity) {
        // Forcer la mise à jour pour afficher les données depuis le cache ou via l'API
        await this.handleCitySelection(lastCity, true);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la dernière ville:", error);
      notificationService.show("mosque.city.error", "error", 0);
    }
  }

  // --- Mettre à jour l'affichage de la date (en fonction de la langue) ---
  updateDateDisplay() {
    const cityDateElement = document.getElementById("mosquetime-city-date");
    const citySelect = document.getElementById("mosquetime-location-select");

    if (!cityDateElement || !citySelect) return;

    const currentLang = localStorage.getItem("userLang") || "fr";
    const locale = currentLang === "en" ? "en-US" : "fr-FR";

    const selectedCityName =
      citySelect.options[citySelect.selectedIndex]?.textContent ||
      (locale === "en-US" ? "Your City" : "Votre Ville");

    const dateString = this.currentDate.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    cityDateElement.textContent = `${selectedCityName}, ${dateString}`;
  }

  // --- Remplir le select des mosquées (dépend de la ville) ---
  populateMosqueSelect(mosques) {
    const select = document.getElementById("mosquetime-mosque-select");
    if (!select) return;

    const currentLang = localStorage.getItem("userLang") || "fr";
    const defaultText =
      currentLang === "en" ? "Select a mosque" : "Sélectionnez une mosquée";

    select.innerHTML = `<option value="">${defaultText}</option>`;

    mosques.forEach((mosque) => {
      const option = document.createElement("option");
      option.value = String(mosque.id); // Conversion explicite en chaîne
      option.textContent = mosque.name;
      option.dataset.address = mosque.address;
      select.appendChild(option);
    });

    console.log("Options du select mises à jour:", select.options);
  }

  // --- Mettre à jour l'affichage de la mosquée sélectionnée ---
  updateMosqueCard(times, mosqueName, mosqueAddress) {
    const container = document.getElementById("mosquetime-single-mosque");
    if (!container) return;

    let mosqueCard = container.querySelector(".mosquetime-mosque-card");
    if (!mosqueCard) {
      mosqueCard = document.createElement("div");
      mosqueCard.className = "mosquetime-mosque-card";
      container.appendChild(mosqueCard);
    }

    const mainPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    const additionalPrayers = [
      "jumuah1",
      "jumuah2",
      "jumuah3",
      "jumuah4",
      "tarawih",
    ];

    let mainPrayerTimesHTML = mainPrayers
      .map(
        (prayer) => `
            <div class="prayer-item">
                <div class="prayer-name">
                    <span class="prayer-label">${
                      prayer.charAt(0).toUpperCase() + prayer.slice(1)
                    }</span>
                    <span class="jamaa-time">${formatPrayerTime(
                      times[prayer]
                    )}</span>
                </div>
            </div>
        `
      )
      .join("");

    let additionalPrayerTimesHTML = additionalPrayers
      .map(
        (prayer) => `
            <div class="prayer-item">
                <div class="prayer-name">
                    <span class="prayer-label">${
                      prayer.charAt(0).toUpperCase() + prayer.slice(1)
                    }</span>
                    <span class="jamaa-time">${formatPrayerTime(
                      times[prayer]
                    )}</span>
                </div>
            </div>
        `
      )
      .join("");

    mosqueCard.innerHTML = `
            <div class="mosque-header">
                <div class="mosque-image"></div>
                <div class="mosque-info">
                    <h3 class="mosque-name">${mosqueName}</h3>
                    <div class="mosque-address">${mosqueAddress || ""}</div>
                </div>
            </div>
            <div class="prayer-times-grid">
                ${mainPrayerTimesHTML}
            </div>
            <div class="additional-times-grid">
                ${additionalPrayerTimesHTML}
            </div>
        `;
  }

  // --- Mettre à jour l'affichage de toutes les mosquées (liste complète) ---
  updateAllMosques() {
    const listContainer = document.getElementById("mosquetime-all-mosques");
    if (!listContainer) return;

    if (!this.currentMosques || this.currentMosques.length === 0) {
      listContainer.innerHTML = `<p class="mosquetime-message">${this.texts.noMosqueFound}</p>`;
      return;
    }

    listContainer.innerHTML = `
      <div class="mosquetime-sort-buttons">
        <button id="mosquetime-sort-asc" class="mosquetime-button">A-Z</button>
        <button id="mosquetime-sort-desc" class="mosquetime-button">Z-A</button>
        <button id="mosquetime-sort-nearest" class="mosquetime-button">Nearest</button>
      </div>
      <div class="mosque-list-container">
        ${this.currentMosques
          .map(
            (mosque) => `
            <div class="mosquetime-mosque-card">
              <div class="mosque-info-container">
                <div class="mosque-text-container">
                  <h3 class="mosque-name">${mosque.name}</h3>
                  <div class="mosque-address">
                    <i class="fas fa-map-marker-alt"></i> ${mosque.address}
                  </div>
                </div>
                <a href="${createMapsLink(
                  mosque.address,
                  mosque.name
                )}" target="_blank" class="mosque-directions-link" title="Obtenir l'itinéraire">
                  ${createNavigationIconSVG()}
                </a>
              </div>
              <div class="mosque-prayer-times">
                ${formatPrayerTimesHTML(mosque.prayerTimes)}
              </div>
            </div>
          `
          )
          .join("")}
      </div>
    `;

    // Réattacher les écouteurs pour les boutons de tri
    this.setupSortListeners();
  }

  setupSortListeners() {
    const sortAsc = document.getElementById("mosquetime-sort-asc");
    const sortDesc = document.getElementById("mosquetime-sort-desc");
    const sortNearest = document.getElementById("mosquetime-sort-nearest");

    if (sortAsc) {
      sortAsc.addEventListener("click", () => this.handleSort("asc"));
    }

    if (sortDesc) {
      sortDesc.addEventListener("click", () => this.handleSort("desc"));
    }

    if (sortNearest) {
      sortNearest.addEventListener("click", () => this.handleSort("nearest"));
    }
  }

  // --- Mettre à jour l'affichage de la mosquée sélectionnée (single) ---
  async updateSingleMosqueTimes() {
    const mosqueSelect = document.getElementById("mosquetime-mosque-select");
    const contentDiv = document.getElementById("mosquetime-single-content");
    if (!mosqueSelect || !contentDiv) return;

    // Si aucune mosquée n'est sélectionnée
    if (!mosqueSelect.value) {
      contentDiv.innerHTML = `<p class="mosquetime-message">${this.texts.selectMosqueToView}</p>`;
      return;
    }

    // Trouver la mosquée sélectionnée dans la liste actuelle
    const selectedMosque = this.currentMosques.find(
      (m) => m.id === parseInt(mosqueSelect.value)
    );

    // Si la mosquée n'est pas trouvée
    if (!selectedMosque) {
      contentDiv.innerHTML = `<p class="mosquetime-error">${this.texts.noMosqueFound}</p>`;
      return;
    }

    // Afficher les détails de la mosquée sélectionnée
    contentDiv.innerHTML = `
      <div class="mosquetime-mosque-card">
        <div class="mosque-header">
          <div class="mosque-info-container">
            <div class="mosque-text-container">
              <h3 class="mosque-name">${selectedMosque.name}</h3>
              <div class="mosque-address">
                <i class="fas fa-map-marker-alt"></i> ${selectedMosque.address}
              </div>
            </div>
            <a href="${createMapsLink(
              selectedMosque.address,
              selectedMosque.name
            )}" target="_blank" class="mosque-directions-link" title="Obtenir l'itinéraire">
              ${createNavigationIconSVG()}
            </a>
          </div>
        </div>
        <div class="mosque-prayer-times">
          ${formatPrayerTimesHTML(selectedMosque.prayerTimes)}
        </div>
      </div>
    `;
  }

  // --- Mettre à jour l'affichage quand aucune mosquée n'est sélectionnée ---
  updateEmptyMosqueCard(mosqueName = "", mosqueAddress = "") {
    const container = document.getElementById("mosquetime-single-mosque");
    if (!container) return;

    let mosqueCard = container.querySelector(".mosquetime-mosque-card");
    if (!mosqueCard) {
      mosqueCard = document.createElement("div");
      mosqueCard.className = "mosquetime-mosque-card";
      container.appendChild(mosqueCard);
    }

    const currentLang = localStorage.getItem("userLang") || "fr";
    const defaultText =
      currentLang === "en" ? "Select a mosque" : "Sélectionnez une mosquée";
    const title = mosqueName || defaultText;

    mosqueCard.innerHTML = `
            <div class="mosque-header">
                <div class="mosque-image"></div>
                <h3 class="mosque-name">${title}</h3>
                <div class="mosque-address">${mosqueAddress}</div>
            </div>
            <div class="prayer-times-grid">
                ${["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
                  .map(
                    (prayer) => `
                    <div class="prayer-item">
                        <div class="prayer-label">${prayer}</div>
                        <div class="jamaa-time">--:--</div>
                    </div>
                `
                  )
                  .join("")}
            </div>
            <div class="additional-times-grid">
                ${["Jumuah1", "Jumuah2", "Jumuah3", "Jumuah4", "Tarawih"]
                  .map(
                    (prayer) => `
                    <div class="prayer-item">
                        <div class="prayer-label">${prayer}</div>
                        <div class="jamaa-time">--:--</div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  // --- Gestion de la sélection de la ville ---
  /**
   * Récupère les données pour une ville donnée et la date sélectionnée.
   * On utilise un cache dans le localStorage pour conserver ces données jusqu'à minuit.
   * @param {string} city
   * @param {boolean} forceUpdate Si true, on force le rafraîchissement même si le cache existe.
   */
  async handleCitySelection(cityName) {
    try {
      // Sauvegarder la ville sélectionnée
      this.selectedCity = cityName;

      // Enregistrer la ville sélectionnée (optionnel)
      await api.post("/mosque-times/user/selected-city", { city: cityName });

      // Vérifier dans le storage en premier
      const cachedData = mosqueTimesStorageService.getCityData(cityName);

      if (cachedData) {
        console.log(`Utilisation des données en cache pour ${cityName}`);
        this.currentMosques = cachedData.currentMosques;
        this.populateMosqueSelect(this.currentMosques);
        this.updateDisplay();
        return;
      }

      // Si pas en cache, charger depuis l'API
      const date = getCurrentDateString();

      // Charger les mosquées
      const mosques = await api.get(
        `/mosque-times/cities/${encodeURIComponent(cityName)}/mosques`
      );
      console.log("Mosquées reçues:", mosques);

      // Charger les horaires
      const prayerTimesData = await api.get(
        `/mosque-times/cities/${encodeURIComponent(
          cityName
        )}/date/${date}/prayer-times`
      );
      console.log("Horaires reçus:", prayerTimesData);

      // Associer les données
      this.currentMosques = mosques.map((mosque) => {
        const prayerTime = prayerTimesData.prayerTimes?.find(
          (pt) => String(pt.mosque_id) === String(mosque.id)
        );
        return {
          ...mosque,
          prayerTimes: prayerTime || null,
        };
      });

      console.log("Mosquées traitées:", this.currentMosques);

      // ✅ NOUVEAU : Vérifier s'il y a des données valides ou démarrer le Long Polling
      const hasValidData = this.currentMosques.some((mosque) => {
        return (
          mosque.prayerTimes &&
          Object.values(mosque.prayerTimes).some(
            (time) =>
              time &&
              time !== "00:00:00" &&
              time !== "00:00" &&
              time !== "0:00" &&
              time !== "--:--"
          )
        );
      });

      if (!hasValidData) {
        console.log(
          "[MosqueTimeManager] Aucun horaire valide trouvé - vérification du scraping"
        );

        try {
          const date = this.getCurrentDateString();
          const scrapingStatus = await api.get(
            `/mosque-times/scraping-status-realtime/${date}`
          );

          console.log(
            "[MosqueTimeManager] Statut du scraping:",
            scrapingStatus
          );

          // ✅ CORRECTION CRITIQUE : La structure est scrapingStatus.data.scraping_status
          if (
            scrapingStatus.success &&
            scrapingStatus.data &&
            scrapingStatus.data.scraping_status === "in_progress"
          ) {
            console.log(
              "[MosqueTimeManager] 🔄 Scraping détecté en cours - démarrage du Long Polling"
            );

            // Notification que le scraping est en cours
            if (typeof notificationService !== "undefined") {
              notificationService.show("mosque.scraping.started", "info");
            }

            // Démarrer l'attente de la fin du scraping
            this.waitForScrapingCompletion();
          }
        } catch (statusError) {
          console.error(
            "[MosqueTimeManager] Erreur vérification statut scraping:",
            statusError
          );
        }
      }

      // Mettre à jour l'interface
      this.populateMosqueSelect(this.currentMosques);

      // Stocker dans le localStorage
      mosqueTimesStorageService.saveCityData(cityName, {
        currentMosques: this.currentMosques,
      });

      // Sauvegarder également la ville sélectionnée
      mosqueTimesStorageService.saveLastSelectedCity(cityName);

      // Mettre à jour l'affichage
      this.updateDisplay();
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  }

  // --- Gestion du tri (asc, desc, nearest) ---
  handleSort(order) {
    this.sortOrder = order;
    if (order === "asc" || order === "desc") {
      this.currentMosques.sort((a, b) => {
        return order === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    } else if (order === "nearest") {
      this.currentMosques.sort(
        (a, b) => (a.distance || Infinity) - (b.distance || Infinity)
      );
    }
    this.updateAllMosques();
  }

  // --- Basculer entre l'affichage "single" et "all" ---
  switchTab(tabName) {
    document.querySelectorAll(".mosquetime-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    const singleMosqueTab = document.getElementById("mosquetime-single-mosque");
    const allMosquesTab = document.getElementById("mosquetime-all-mosques");

    if (tabName === "single") {
      singleMosqueTab.style.display = "block";
      allMosquesTab.style.display = "none";
    } else {
      singleMosqueTab.style.display = "none";
      allMosquesTab.style.display = "block";
      // Update the all mosques view when switching to it
      this.updateAllMosques();
    }
  }

  // --- Configuration des écouteurs d'événements DOM ---
  setupEventListeners() {
    const citySelect = document.getElementById("mosquetime-location-select");
    if (citySelect) {
      citySelect.addEventListener("change", async (e) => {
        const selectedCity = e.target.value;
        if (selectedCity) {
          await this.handleCitySelection(selectedCity, true);
        }
      });
    }

    const mosqueSelect = document.getElementById("mosquetime-mosque-select");
    if (mosqueSelect) {
      mosqueSelect.addEventListener("change", async () => {
        await this.updateSingleMosqueTimes();
      });
    }

    document.querySelectorAll(".mosquetime-tab").forEach((tab) => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.tab));
    });

    const sortButtons = {
      asc: document.getElementById("mosquetime-sort-asc"),
      desc: document.getElementById("mosquetime-sort-desc"),
      nearest: document.getElementById("mosquetime-sort-nearest"),
    };

    Object.entries(sortButtons).forEach(([order, button]) => {
      if (button) {
        button.addEventListener("click", () => this.handleSort(order));
      }
    });

    // Gestionnaire d'événements pour le bouton de localisation
    const locationButton = document.getElementById("mosquetime-use-location");
    if (locationButton) {
      locationButton.addEventListener("click", () =>
        this.handleLocationRequest()
      );
    }

    // Gestionnaire d'événements pour le bouton de recherche
    const searchButton = document.getElementById("mosquetime-search");
    if (searchButton) {
      searchButton.addEventListener("click", () => {
        const selectedCity = document.getElementById(
          "mosquetime-location-select"
        )?.value;
        if (selectedCity) {
          this.handleCitySelection(selectedCity, true);
        }
      });
    }
  }

  // --- Réattacher le listener sur la liste de mosquées (facultatif) ---
  reattachMosqueSelectListener() {
    const mosqueSelect = document.getElementById("mosquetime-mosque-select");
    if (mosqueSelect) {
      mosqueSelect.removeEventListener("change", this.updateSingleMosqueTimes);
      mosqueSelect.addEventListener("change", async () => {
        await this.updateSingleMosqueTimes();
      });
    }
  }

  // --- Gestion de la géolocalisation pour trouver la ville la plus proche ---
  async handleLocationRequest() {
    if (!navigator.geolocation) {
      notificationService.show("mosque.geolocation.unsupported", "error", 0);
      return;
    }

    try {
      notificationService.show("mosque.geolocation.searching", "info");

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      const nearestCity = await api.get(
        `/mosque-times/cities/nearest?lat=${latitude}&lng=${longitude}`
      );

      if (nearestCity) {
        await this.handleCitySelection(nearestCity, true);
        notificationService.show("mosque.location.found", "success");
      } else {
        notificationService.show("mosque.nearest.error", "error", 0);
      }
    } catch (error) {
      console.error("Erreur de géolocalisation:", error);
      notificationService.show("mosque.geolocation.error", "error", 0);
    }
  }

  // --- Ajouter cette méthode à la classe MosqueTimeManager
  updateDisplay() {
    try {
      // Nous ne bloquons plus tout le processus si le conteneur principal n'est pas trouvé
      // Chaque méthode individuelle fera sa propre vérification

      // Essayer de mettre à jour l'affichage unique
      this.updateSingleMosqueTimes();

      // Essayer de mettre à jour la liste complète
      this.updateAllMosques();

      // Mise à jour de l'affichage de la date si la méthode existe
      if (typeof this.updateDateDisplay === "function") {
        this.updateDateDisplay();
      }

      // Sauvegarder la dernière ville sélectionnée
      if (this.selectedCity) {
        mosqueTimesStorageService.saveLastSelectedCity(this.selectedCity);
      }

      // Afficher une notification de succès seulement si nous sommes sur la page principale
      // et pas dans le widget d'accueil
      if (!this.isWelcomePage) {
        notificationService.show("mosque.city.selected", "success");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'affichage:", error);
    }
  }

  // Correction de la méthode formatPrayerTimes pour aligner correctement les horaires

  // Écouter les événements de fin de scraping pour auto-refresh
  setupScrapingEventListeners() {
    console.log("[MosqueTimeManager] Configuration des événements de scraping");

    // Écouter les événements personnalisés de scraping
    document.addEventListener("scrapingStarted", (event) => {
      this.handleScrapingStarted(event.detail);
    });

    document.addEventListener("scrapingCompleted", (event) => {
      this.handleScrapingCompleted(event.detail);
    });

    document.addEventListener("scrapingFailed", (event) => {
      this.handleScrapingFailed(event.detail);
    });

    // ✅ Variables de polling supprimées - EventEmitter backend gère tout
  }

  /**
   * Gère le démarrage du scraping
   */
  handleScrapingStarted(data) {
    console.log("[MosqueTimeManager] Scraping démarré:", data);

    // Notification de démarrage
    if (typeof notificationService !== "undefined") {
      notificationService.show("mosque.scraping.started", "info");
    }

    // ✅ Démarrer l'attente IMMÉDIATE de la fin réelle du scraping
    this.waitForScrapingCompletion();
  }

  /**
   * Gère la completion du scraping
   */
  async handleScrapingCompleted(data) {
    console.log("[MosqueTimeManager] Scraping terminé:", data);

    // ✅ Annuler l'attente si elle est en cours
    this.cancelWaitForCompletion();

    // Notification de success
    if (typeof notificationService !== "undefined") {
      notificationService.show("mosque.scraping.completed", "success");
    }

    // Invalider le cache et rafraîchir
    await this.invalidateCacheAndRefresh();
  }

  /**
   * Gère l'échec du scraping
   */
  handleScrapingFailed(data) {
    console.log("[MosqueTimeManager] Scraping échoué:", data);

    // ✅ Annuler l'attente si elle est en cours
    this.cancelWaitForCompletion();

    // Notification d'erreur
    if (typeof notificationService !== "undefined") {
      notificationService.show("mosque.scraping.failed", "error");
    }
  }

  /**
   * ✅ NOUVEAU: Attendre la fin RÉELLE du scraping via Long Polling
   * Cette méthode ne fait QU'UNE SEULE requête qui attend la vraie fin
   */
  async waitForScrapingCompletion() {
    // Annuler toute attente précédente
    this.cancelWaitForCompletion();

    const date = getCurrentDateString();
    console.log(
      `[MosqueTimeManager] 📡 Attente RÉELLE de fin de scraping pour ${date}`
    );

    try {
      // ✅ Long Polling - cette requête ne se termine que quand le scraping est vraiment fini
      this.waitRequest = this.fetchData(`wait-scraping-completion/${date}`);
      const response = await this.waitRequest;

      if (response.success) {
        console.log(
          `[MosqueTimeManager] 🎉 Notification de fin reçue:`,
          response
        );

        if (response.status === "completed" && response.data_exists) {
          // Notification de succès
          if (typeof notificationService !== "undefined") {
            notificationService.show("mosque.scraping.completed", "success");
          }

          // Auto-refresh immédiat
          await this.invalidateCacheAndRefresh();
        } else {
          console.log(
            `[MosqueTimeManager] ⚠️ Scraping terminé mais données non disponibles`
          );
        }
      } else if (response.status === "timeout") {
        console.log(
          `[MosqueTimeManager] ⏰ Timeout de l'attente - pas critique`
        );
      } else {
        console.log(
          `[MosqueTimeManager] ℹ️ Réponse d'attente:`,
          response.message
        );
      }
    } catch (error) {
      // Si l'erreur n'est pas due à une annulation
      if (error.name !== "AbortError") {
        console.error(
          "[MosqueTimeManager] ❌ Erreur attente completion:",
          error
        );
      } else {
        console.log("[MosqueTimeManager] 🚫 Attente annulée (normal)");
      }
    } finally {
      this.waitRequest = null;
    }
  }

  /**
   * ✅ NOUVEAU: Annuler l'attente de completion
   */
  cancelWaitForCompletion() {
    if (this.waitRequest && typeof this.waitRequest.abort === "function") {
      console.log(
        "[MosqueTimeManager] 🚫 Annulation de l'attente Long Polling"
      );
      this.waitRequest.abort();
      this.waitRequest = null;
    }
  }

  /**
   * Invalide le cache et rafraîchit les données
   */
  async invalidateCacheAndRefresh() {
    console.log(
      "[MosqueTimeManager] Invalidation du cache et rafraîchissement des données"
    );

    try {
      // ✅ CORRECTION CRITIQUE : Mettre à jour la date courante avant le rafraîchissement
      console.log("[MosqueTimeManager] Mise à jour de la date courante...");
      this.currentDate = new Date();
      const newDate = getCurrentDateString();
      console.log(`[MosqueTimeManager] Date mise à jour: ${newDate}`);

      // ✅ DÉLAI DE SÉCURITÉ : Attendre que toutes les transactions DB soient committées
      console.log(
        "[MosqueTimeManager] ⏳ Délai de sécurité de 3 secondes pour finalisation des transactions DB..."
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Vider tout le cache
      if (typeof mosqueTimesStorageService !== "undefined") {
        console.log("[MosqueTimeManager] Suppression du cache...");
        mosqueTimesStorageService.clearAllData();

        if (typeof notificationService !== "undefined") {
          notificationService.show("mosque.cache.cleared", "success");
        }
      }

      // Recharger les données pour la ville actuelle
      const currentCity = this.selectedCity;
      if (currentCity) {
        console.log(
          `[MosqueTimeManager] Rechargement des données pour ${currentCity} à la date ${newDate}`
        );

        if (typeof notificationService !== "undefined") {
          notificationService.show("mosque.data.refreshed", "info");
        }

        // Forcer le rechargement complet avec la nouvelle date
        await this.handleCitySelection(currentCity);

        if (typeof notificationService !== "undefined") {
          notificationService.show("mosque.background.update", "success");
        }
      }
    } catch (error) {
      console.error(
        "[MosqueTimeManager] Erreur lors du rafraîchissement:",
        error
      );

      if (typeof notificationService !== "undefined") {
        notificationService.show("mosque.refresh.failed", "error");
      }
    }
  }
}

// --- Export de la fonction d'initialisation ---
export function initializeMosqueTime() {
  const mosqueTimeManager = new MosqueTimeManager();
  return mosqueTimeManager.initialize();
}
