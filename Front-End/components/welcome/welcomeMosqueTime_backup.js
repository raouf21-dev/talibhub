import { MosqueTimeManager } from "../mosqueTime/mosqueTime.js";
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

/**
 * Classe spécialisée pour l'affichage des horaires de mosquée sur la page d'accueil
 * Hérite de MosqueTimeManager et ajoute uniquement les spécificités de la welcome page
 */
export class WelcomeMosqueTime extends MosqueTimeManager {
  constructor() {
    // Configuration spécifique à la welcome page
    const options = {
      isWelcomePage: true,
      container: document.getElementById("welcomepage-mosque-time"),
    };

    super(options);
    console.log("WelcomeMosqueTime: Specialized constructor completed");

    this.apiBaseUrl = API_BASE_URL;
    this.cachePrefix = "public_";

    // Variables spécifiques au scraping automatique
    this.waitRequest = null;

    this.currentMosques = [];
    this.selectedCity = null;

    // Déterminer la langue actuelle
    this.currentLang = localStorage.getItem("language") || "en";

    // Définir les textes selon la langue
    this.texts = this.getLocalizedTexts();

    // Écouter les changements de langue
    window.addEventListener("languageChanged", (event) => {
      this.currentLang = event.detail.language;
      this.texts = this.getLocalizedTexts();
      this.updateInterface();
    });

    this.updateInterface();
  }

  // Méthode pour obtenir les textes localisés
  getLocalizedTexts() {
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
      },
    };

    return texts[this.currentLang] || texts.en;
  }

  async initialize() {
    console.log("WelcomeMosqueTime: Initializing...");
    if (!this.container) {
      console.error(
        "WelcomeMosqueTime: Container welcomepage-mosque-time not found"
      );
      return;
    }

    // Setup initial HTML
    console.log("WelcomeMosqueTime: Setting up HTML structure");
    this.updateInterface();

    // Setup event listeners
    console.log("WelcomeMosqueTime: Setting up event listeners");
    this.setupEventListeners();

    // Setup scraping event listeners
    console.log("WelcomeMosqueTime: Setting up scraping event listeners");
    this.setupScrapingEventListeners();

    // ✅ CORRECTION : Load cities FIRST so getCurrentCity() works during refresh
    console.log("WelcomeMosqueTime: Loading cities");
    await this.loadCities();

    // Vérifier d'abord si des données existent pour aujourd'hui
    // et déclencher le scraping si nécessaire
    console.log("WelcomeMosqueTime: Checking for today's data in DB");
    await this.checkAndUpdateData();

    // Vérifier l'intégrité des données locales
    console.log("WelcomeMosqueTime: Checking data integrity");
    await this.checkAndFixDataIntegrity();

    // Sélectionner l'onglet "All Mosques" par défaut
    console.log("WelcomeMosqueTime: Setting default tab to All Mosques");
    const tabs = document.querySelectorAll(".mosquetime-tab");
    tabs.forEach((tab) => {
      if (tab.dataset.tab === "all") {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // Activer l'onglet "All Mosques"
    this.switchTab("all");
  }

  // Nouvelle méthode pour vérifier et corriger l'intégrité des données
  async checkAndFixDataIntegrity() {
    // Si les mosquées sont chargées mais qu'aucune n'a d'horaires, essayer de les récupérer
    if (
      this.currentMosques &&
      this.currentMosques.length > 0 &&
      this.selectedCity
    ) {
      let hasMissingTimes = false;
      let hasSomeTimes = false;

      this.currentMosques.forEach((mosque) => {
        if (!mosque.prayerTimes) {
          hasMissingTimes = true;
        } else {
          // Vérifier si les horaires sont valides (pas uniquement des 00:00:00)
          const hasValidTimes = Object.values(mosque.prayerTimes).some(
            (time) =>
              time &&
              time !== "00:00:00" &&
              time !== "00:00" &&
              time !== "0:00" &&
              time !== "--:--"
          );

          if (hasValidTimes) {
            hasSomeTimes = true;
            console.log(
              `[DEBUG] WelcomeMosqueTime: Mosquée ${mosque.id} (${mosque.name}) a des horaires valides`,
              mosque.prayerTimes
            );
          } else {
            hasMissingTimes = true;
            console.warn(
              `[DEBUG] WelcomeMosqueTime: Mosquée ${mosque.id} (${mosque.name}) a des horaires invalides (00:00:00)`,
              mosque.prayerTimes
            );
          }
        }
      });

      // Si aucune mosquée n'a d'horaires, c'est probablement un problème
      if (hasMissingTimes && !hasSomeTimes) {
        console.warn(
          "[DEBUG] WelcomeMosqueTime: Problème détecté - mosquées sans horaires"
        );

        try {
          // Supprimer les données en cache pour forcer une récupération complète
          mosqueTimesStorageService.clearAllData();

          // Réessayer de charger les données
          const cityName = this.selectedCity;
          console.log(
            "[DEBUG] WelcomeMosqueTime: Tentative de récupération complète pour",
            cityName
          );

          // Simuler un clic sur le bouton de recherche pour relancer le processus
          const searchBtn = document.getElementById(
            "welcome-mosquetime-search"
          );
          if (searchBtn) {
            console.log(
              "[DEBUG] WelcomeMosqueTime: Relance automatique de la recherche"
            );
            searchBtn.click();
          } else {
            // Essayer de récupérer les données directement
            const date = getCurrentDateString();

            // Recharger les mosquées
            const mosques = await api.get(
              `/mosque-times/cities/${encodeURIComponent(cityName)}/mosques`
            );

            if (mosques && mosques.length > 0) {
              // Charger les horaires
              const prayerTimesData = await api.get(
                `/mosque-times/cities/${encodeURIComponent(
                  cityName
                )}/date/${date}/prayer-times`
              );

              if (prayerTimesData && prayerTimesData.prayerTimes) {
                // Mettre à jour les données
                this.currentMosques = mosques.map((mosque) => {
                  const prayerTime = prayerTimesData.prayerTimes.find(
                    (pt) => String(pt.mosque_id) === String(mosque.id)
                  );
                  return {
                    ...mosque,
                    prayerTimes: prayerTime || null,
                  };
                });

                // Mettre à jour l'affichage
                this.updateInterface();
                this.displayAllMosques();

                // Sauvegarder dans le cache
                mosqueTimesStorageService.saveCityData(cityName, {
                  currentMosques: this.currentMosques,
                });
              }
            }
          }
        } catch (error) {
          console.error(
            "[DEBUG] WelcomeMosqueTime: Erreur lors de la récupération des données:",
            error
          );
        }
      }
    }
  }

  // Méthode pour mettre à jour l'interface selon la langue
  updateInterface() {
    if (!this.container) return;

    this.container.innerHTML = `
        <div class="mosquetime-card">
            <header class="mosquetime-header">
                <h1 class="mosquetime-title">${this.texts.title}</h1>
                <p class="mosquetime-subtitle">${this.texts.subtitle}</p>
            </header>

            <div class="mosquetime-content">
                <div class="mosquetime-location-search">
                    <!--<button id="welcome-mosquetime-location" class="mosquetime-button">
                        <i class="fas fa-map-marker-alt"></i> ${this.texts.useLocation}
                    </button>-->
                    <select id="welcome-mosquetime-city" class="mosquetime-select">
                        <option value="">${this.texts.selectCity}</option>
                    </select>
                    <button id="welcome-mosquetime-search" class="mosquetime-button">${this.texts.search}</button>
                </div>

                <div id="welcome-mosquetime-loading" style="display: none">
                    ${this.texts.loading}
                </div>

                <div id="welcome-mosquetime-error" class="mosquetime-error" style="display: none"></div>

                <div class="mosquetime-date-display">
                    <h2 id="welcome-mosquetime-city-date"></h2>
                </div>

                <div class="mosquetime-tabs">
                    <div class="mosquetime-tab active" data-tab="single">${this.texts.singleMosque}</div>
                    <div class="mosquetime-tab" data-tab="all">${this.texts.allMosques}</div>
                </div>

                <div id="welcome-mosquetime-single-mosque" class="mosquetime-tab-content">
                    <select id="welcome-mosquetime-mosque-select" class="mosquetime-select">
                        <option value="">${this.texts.selectMosque}</option>
                    </select>
                    <div id="welcome-mosquetime-single-content"></div>
                </div>

                <div id="welcome-mosquetime-all-mosques" class="mosquetime-tab-content" style="display: none">
                    <div class="mosquetime-sort-buttons">
                        <button id="welcome-mosquetime-sort-asc" class="mosquetime-button">${this.texts.sortAZ}</button>
                        <button id="welcome-mosquetime-sort-desc" class="mosquetime-button">${this.texts.sortZA}</button>
                        <button id="welcome-mosquetime-sort-nearest" class="mosquetime-button">${this.texts.sortNearest}</button>
                    </div>
                    <div id="welcome-mosquetime-grid"></div>
                </div>

                <p class="mosquetime-disclaimer">
                    ${this.texts.disclaimer}
                </p>
            </div>
        </div>
    `;

    // Réinitialiser les écouteurs d'événements après la mise à jour du DOM
    this.setupEventListeners();

    // Si nous avons déjà des données, les réafficher
    if (this.currentMosques && this.currentMosques.length > 0) {
      this.populateMosqueSelect(this.currentMosques);
      this.displayAllMosques();
      this.updateSingleMosqueTimes();
    }

    // Mettre à jour l'affichage de la date
    this.updateDateDisplay();

    // Ajouter un style personnalisé pour les liens d'adresses
    const styleElement = document.createElement("style");
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

  setupEventListeners() {
    console.log("WelcomeMosqueTime: Setting up event listeners");

    // Gestion des onglets
    const tabs = document.querySelectorAll(".mosquetime-tab");
    console.log("WelcomeMosqueTime: Found tabs:", tabs.length);

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        console.log("WelcomeMosqueTime: Tab clicked:", tab.dataset.tab);
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        this.switchTab(tab.dataset.tab);
      });
    });

    // Gestion du tri
    const sortButtons = {
      asc: document.getElementById("welcome-mosquetime-sort-asc"),
      desc: document.getElementById("welcome-mosquetime-sort-desc"),
      nearest: document.getElementById("welcome-mosquetime-sort-nearest"),
    };

    if (sortButtons.asc) {
      sortButtons.asc.addEventListener("click", () => {
        this.currentMosques.sort((a, b) => a.name.localeCompare(b.name));
        this.displayAllMosques();
      });
    }

    if (sortButtons.desc) {
      sortButtons.desc.addEventListener("click", () => {
        this.currentMosques.sort((a, b) => b.name.localeCompare(a.name));
        this.displayAllMosques();
      });
    }

    if (sortButtons.nearest) {
      sortButtons.nearest.addEventListener("click", async () => {
        try {
          const position = await this.getCurrentPosition();
          this.currentMosques.sort((a, b) => {
            const distA = calculateDistance(position, a.coordinates);
            const distB = calculateDistance(position, b.coordinates);
            return distA - distB;
          });
          this.displayAllMosques();
        } catch (error) {
          console.error("Error getting location:", error);
          notificationService.show("location.error", "error");
        }
      });
    }

    // Gestion de la sélection de ville
    const citySelect = document.getElementById("welcome-mosquetime-city");
    console.log("WelcomeMosqueTime: City select found:", citySelect);

    if (citySelect) {
      citySelect.addEventListener("change", async (e) => {
        const selectedCity = e.target.value;
        console.log("WelcomeMosqueTime: City selected:", selectedCity);
        if (selectedCity) {
          await this.handleCitySelection(selectedCity);
        }
      });
    }

    // Gestion de la géolocalisation
    const locationButton = document.getElementById(
      "welcome-mosquetime-location"
    );
    if (locationButton) {
      locationButton.addEventListener("click", () =>
        this.handleLocationRequest()
      );
    }

    // Ajout du gestionnaire pour le bouton Search
    const searchButton = document.getElementById("welcome-mosquetime-search");
    if (searchButton) {
      searchButton.addEventListener("click", () => {
        const citySelect = document.getElementById("welcome-mosquetime-city");
        if (citySelect && citySelect.value) {
          this.handleCitySelection(citySelect.value);
        }
      });
    }

    // Mise à jour de l'affichage de la date et de la ville
    this.updateDateDisplay();
  }

  initializeWelcomeSpecifics() {
    console.log("WelcomeMosqueTime: Initializing welcome specifics");
    // Méthode vide car nous n'avons plus de date picker à configurer
  }

  // Modifier la méthode fetchData pour corriger la construction de l'URL
  async fetchData(endpoint, options = {}) {
    const defaultOptions = {
      headers: {
        "X-Source": "welcome-page",
        "Content-Type": "application/json",
      },
    };

    try {
      // Correction: s'assurer qu'il y a un slash entre api et l'endpoint
      const fullEndpoint = endpoint.startsWith("http")
        ? endpoint
        : `/mosque-times/${endpoint}`;
      return await api.request(fullEndpoint, { ...defaultOptions, ...options });
    } catch (error) {
      console.error("WelcomeMosqueTime: Error fetching data:", error);
      throw error;
    }
  }

  // Surcharge de la méthode de cache
  getCacheKey(key) {
    return `${this.cachePrefix}${key}`;
  }

  // Méthode pour construire les URLs d'API
  getApiUrl(endpoint) {
    return `${this.apiBaseUrl}/mosque-times/${endpoint}`;
  }

  async loadCities() {
    try {
      console.log("[DEBUG] WelcomeMosqueTime: Starting loadCities");

      // Utiliser api au lieu de fetch avec le bon chemin
      const cities = await api.get("/mosque-times/cities/search");
      console.log("WelcomeMosqueTime: Cities loaded:", cities);

      // Populate city select
      const citySelect = document.getElementById("welcome-mosquetime-city");
      if (citySelect) {
        citySelect.innerHTML = `<option value="">${this.texts.selectCity}</option>`;
        cities.forEach((city) => {
          const option = document.createElement("option");
          option.value = city;
          option.textContent = city;
          citySelect.appendChild(option);
        });

        // Charger la dernière ville sélectionnée ou la première ville disponible
        const lastCity = localStorage.getItem("lastSelectedCity") || cities[0];
        if (lastCity) {
          console.log(
            "WelcomeMosqueTime: Loading last selected city:",
            lastCity
          );
          citySelect.value = lastCity;
          await this.handleCitySelection(lastCity);
        }
      }
    } catch (error) {
      console.error("WelcomeMosqueTime: Error loading cities:", error);
    }
  }

  // Surcharge des méthodes pour utiliser les IDs préfixés
  switchTab(tabName) {
    console.log("WelcomeMosqueTime: Switching to tab:", tabName);
    const contentElements = {
      singleContent: document.getElementById(
        "welcome-mosquetime-single-mosque"
      ),
      allContent: document.getElementById("welcome-mosquetime-all-mosques"),
    };
    console.log("WelcomeMosqueTime: Content elements:", contentElements);

    if (tabName === "single") {
      contentElements.singleContent.style.display = "block";
      contentElements.allContent.style.display = "none";
      this.updateSingleMosqueTimes();
    } else {
      contentElements.singleContent.style.display = "none";
      contentElements.allContent.style.display = "block";
      this.displayAllMosques();
    }
  }

  // Surcharge pour utiliser les bons sélecteurs
  populateMosqueSelect(mosques) {
    console.log("WelcomeMosqueTime: Populating mosque select with:", mosques);
    const select = document.getElementById("welcome-mosquetime-mosque-select");
    if (!select) {
      console.error("WelcomeMosqueTime: Mosque select element not found");
      return;
    }

    select.innerHTML = `<option value="">${this.texts.selectMosque}</option>`;
    mosques.forEach((mosque) => {
      const option = document.createElement("option");
      option.value = mosque.id;
      option.textContent = mosque.name;
      select.appendChild(option);
    });

    // Correction de l'attachement de l'événement
    select.removeEventListener(
      "change",
      this.updateSingleMosqueTimes.bind(this)
    );
    select.addEventListener("change", () => {
      console.log("WelcomeMosqueTime: Mosque select changed");
      this.updateSingleMosqueTimes();
    });
  }

  // Surcharge pour l'affichage des mosquées
  async displayAllMosques() {
    console.log("[DEBUG] WelcomeMosqueTime: Displaying all mosques");
    const grid = document.getElementById("welcome-mosquetime-grid");
    if (!grid) {
      console.error("[DEBUG] WelcomeMosqueTime: Grid element not found");
      return;
    }
    if (!this.currentMosques || !this.currentMosques.length) {
      console.warn("[DEBUG] WelcomeMosqueTime: No mosques to display");
      return;
    }

    // Vérifier si les horaires sont présents et valides
    let hasMissingTimes = false;
    let hasSomeTimes = false;

    this.currentMosques.forEach((mosque) => {
      if (!mosque.prayerTimes) {
        hasMissingTimes = true;
        console.warn(
          `[DEBUG] WelcomeMosqueTime: Mosquée ${mosque.id} (${mosque.name}) n'a pas d'horaires`
        );
      } else {
        // Vérifier si les horaires sont valides (pas uniquement des 00:00:00)
        const hasValidTimes = Object.values(mosque.prayerTimes).some(
          (time) =>
            time &&
            time !== "00:00:00" &&
            time !== "00:00" &&
            time !== "0:00" &&
            time !== "--:--"
        );

        if (hasValidTimes) {
          hasSomeTimes = true;
          console.log(
            `[DEBUG] WelcomeMosqueTime: Mosquée ${mosque.id} (${mosque.name}) a des horaires valides`,
            mosque.prayerTimes
          );
        } else {
          hasMissingTimes = true;
          console.warn(
            `[DEBUG] WelcomeMosqueTime: Mosquée ${mosque.id} (${mosque.name}) a des horaires invalides (00:00:00)`,
            mosque.prayerTimes
          );
        }
      }
    });

    // Si toutes les mosquées n'ont pas d'horaires, vérifier si un scraping est en cours
    if (hasMissingTimes && !hasSomeTimes && this.selectedCity) {
      console.log(
        "[DEBUG] WelcomeMosqueTime: Aucun horaire trouvé - vérification du scraping"
      );

      // ✅ NOUVEAU : Vérifier s'il y a un scraping en cours et attendre la fin si c'est le cas
      try {
        const date = getCurrentDateString();
        const scrapingStatus = await api.get(
          `/mosque-times/scraping-status-realtime/${date}`
        );

        console.log(
          "[DEBUG] WelcomeMosqueTime: Statut du scraping:",
          scrapingStatus
        );

        // ✅ CORRECTION CRITIQUE : La structure est scrapingStatus.data.scraping_status
        if (
          scrapingStatus.success &&
          scrapingStatus.data &&
          scrapingStatus.data.scraping_status === "in_progress"
        ) {
          console.log(
            "[DEBUG] WelcomeMosqueTime: 🔄 Scraping détecté en cours - démarrage du Long Polling"
          );

          // Notification que le scraping est en cours
          if (typeof notificationService !== "undefined") {
            notificationService.show("mosque.scraping.started", "info");
          }

          // Démarrer l'attente de la fin du scraping
          this.waitForScrapingCompletion();
          return; // Sortir ici pour ne pas faire la récupération d'urgence
        } else {
          console.log(
            "[DEBUG] WelcomeMosqueTime: ✅ Aucun scraping en cours, statut:",
            scrapingStatus.data
              ? scrapingStatus.data.scraping_status
              : "unknown"
          );
        }
      } catch (statusError) {
        console.error(
          "[DEBUG] WelcomeMosqueTime: Erreur vérification statut scraping:",
          statusError
        );
      }

      console.log(
        "[DEBUG] WelcomeMosqueTime: Tentative de récupération d'urgence des horaires"
      );
      try {
        const date = getCurrentDateString();
        const cityName = this.selectedCity;

        // Appel direct à l'API pour récupérer les horaires
        const prayerTimesData = await api.get(
          `/mosque-times/cities/${encodeURIComponent(
            cityName
          )}/date/${date}/prayer-times`
        );

        console.log(
          "[DEBUG] WelcomeMosqueTime: Récupération d'urgence - résultat:",
          prayerTimesData
        );

        if (
          prayerTimesData &&
          prayerTimesData.prayerTimes &&
          prayerTimesData.prayerTimes.length > 0
        ) {
          // Mettre à jour les horaires des mosquées
          this.currentMosques = this.currentMosques.map((mosque) => {
            const prayerTime = prayerTimesData.prayerTimes.find(
              (pt) => String(pt.mosque_id) === String(mosque.id)
            );
            return {
              ...mosque,
              prayerTimes: prayerTime || null,
            };
          });

          // Mettre à jour le cache
          mosqueTimesStorageService.saveCityData(cityName, {
            currentMosques: this.currentMosques,
          });

          // Vérifier à nouveau les horaires
          hasMissingTimes = false;
          this.currentMosques.forEach((mosque) => {
            if (!mosque.prayerTimes) {
              hasMissingTimes = true;
            }
          });
        }
      } catch (error) {
        console.error(
          "[DEBUG] WelcomeMosqueTime: Échec de la récupération d'urgence",
          error
        );
      }
    }

    grid.innerHTML =
      `<div class="scrollable-content">` +
      this.currentMosques
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
        ${
          mosque.prayerTimes
            ? formatPrayerTimesHTML(mosque.prayerTimes)
            : `<p class="mosque-no-times">${this.texts.prayerNotAvailable}</p>`
        }
      </div>
    </div>
  `
        )
        .join("") +
      `</div>`;
  }

  // Surcharge pour l'affichage d'une seule mosquée
  async updateSingleMosqueTimes() {
    console.log("WelcomeMosqueTime: Updating single mosque times");
    const mosqueSelect = document.getElementById(
      "welcome-mosquetime-mosque-select"
    );
    const contentDiv = document.getElementById(
      "welcome-mosquetime-single-content"
    );

    if (!mosqueSelect || !contentDiv) {
      console.error("WelcomeMosqueTime: Required elements not found");
      return;
    }

    console.log("WelcomeMosqueTime: Selected mosque ID:", mosqueSelect.value);
    console.log("WelcomeMosqueTime: Current mosques:", this.currentMosques);

    const selectedMosque = this.currentMosques.find(
      (m) => m.id === parseInt(mosqueSelect.value)
    );

    console.log("WelcomeMosqueTime: Selected mosque data:", selectedMosque);

    if (!selectedMosque) {
      contentDiv.innerHTML = `<p class="mosquetime-error">${this.texts.pleaseSelectMosque}</p>`;
      return;
    }

    contentDiv.innerHTML = `
        <div class="mosquetime-mosque-card">
            <div class="mosque-header">
                <div class="mosque-info-container">
                    <div class="mosque-text-container">
                        <h3 class="mosque-name">${selectedMosque.name}</h3>
                        <div class="mosque-address">
                            <i class="fas fa-map-marker-alt"></i> ${
                              selectedMosque.address
                            }
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

  // Surcharge de handleCitySelection pour gérer le cas public et utiliser les cookies
  async handleCitySelection(cityName) {
    try {
      console.log(
        "[DEBUG] WelcomeMosqueTime: Handling city selection for",
        cityName
      );

      // Sauvegarder la ville sélectionnée
      this.selectedCity = cityName;

      // Vérifier dans le storage en premier
      const cachedData = mosqueTimesStorageService.getCityData(cityName);
      console.log(
        "[DEBUG] WelcomeMosqueTime: Données en cache pour",
        cityName,
        cachedData ? "trouvées" : "non trouvées"
      );

      if (cachedData) {
        console.log(
          "[DEBUG] WelcomeMosqueTime: Utilisation des données en cache pour",
          cityName,
          cachedData
        );
        this.currentMosques = cachedData.currentMosques;
        this.populateMosqueSelect(this.currentMosques);
        this.displayAllMosques();
        this.updateDateDisplay(cityName);
        localStorage.setItem("lastSelectedCity", cityName);
        return;
      }

      // Si données non trouvées, charger depuis l'API
      try {
        const date = getCurrentDateString();
        console.log(
          "[DEBUG] WelcomeMosqueTime: Chargement des données pour la date",
          date
        );

        // Charger les mosquées
        console.log(
          "[DEBUG] WelcomeMosqueTime: Appel API pour les mosquées de",
          cityName
        );
        const mosques = await api.get(
          `/mosque-times/cities/${encodeURIComponent(cityName)}/mosques`
        );
        console.log("[DEBUG] WelcomeMosqueTime: Mosquées reçues:", mosques);

        if (!mosques || mosques.length === 0) {
          console.warn(
            "[DEBUG] WelcomeMosqueTime: No mosques found for city",
            cityName
          );
          return;
        }

        // Charger les horaires
        console.log(
          "[DEBUG] WelcomeMosqueTime: Appel API pour les horaires:",
          `/mosque-times/cities/${encodeURIComponent(
            cityName
          )}/date/${date}/prayer-times`
        );
        const prayerTimesData = await api.get(
          `/mosque-times/cities/${encodeURIComponent(
            cityName
          )}/date/${date}/prayer-times`
        );
        console.log(
          "[DEBUG] WelcomeMosqueTime: Horaires reçus:",
          prayerTimesData
        );
        console.log(
          "[DEBUG] WelcomeMosqueTime: prayerTimes disponible:",
          !!prayerTimesData?.prayerTimes
        );

        // Associer les horaires aux mosquées
        this.currentMosques = mosques.map((mosque) => {
          const prayerTime = prayerTimesData.prayerTimes?.find(
            (pt) => String(pt.mosque_id) === String(mosque.id)
          );
          console.log(
            "[DEBUG] WelcomeMosqueTime: Horaire pour mosquée",
            mosque.id,
            "trouvé:",
            !!prayerTime
          );
          return {
            ...mosque,
            prayerTimes: prayerTime || null,
          };
        });

        console.log(
          "[DEBUG] WelcomeMosqueTime: Mosquées traitées:",
          this.currentMosques
        );

        // ✅ NOUVEAU : Vérification intelligente et retry automatique
        const mosquesWithoutTimes = this.currentMosques.filter(
          (mosque) => !mosque.prayerTimes
        );
        const totalMosques = this.currentMosques.length;
        const percentageMissing =
          (mosquesWithoutTimes.length / totalMosques) * 100;

        console.log(
          `[DEBUG] WelcomeMosqueTime: ${
            mosquesWithoutTimes.length
          }/${totalMosques} mosquées sans horaires (${percentageMissing.toFixed(
            1
          )}%)`
        );

        // Si plus de 20% des mosquées manquent d'horaires, faire un retry après 3 secondes
        if (percentageMissing > 20 && !this._hasRetriedForCity) {
          console.log(
            "[DEBUG] WelcomeMosqueTime: Trop de mosquées sans horaires, retry automatique dans 3 secondes..."
          );
          this._hasRetriedForCity = true;

          setTimeout(async () => {
            try {
              console.log(
                "[DEBUG] WelcomeMosqueTime: Retry - nouvelle tentative de récupération des horaires"
              );
              const retryPrayerTimesData = await api.get(
                `/mosque-times/cities/${encodeURIComponent(
                  cityName
                )}/date/${date}/prayer-times`
              );

              // Re-associer les horaires
              this.currentMosques = this.currentMosques.map((mosque) => {
                const prayerTime = retryPrayerTimesData.prayerTimes?.find(
                  (pt) => String(pt.mosque_id) === String(mosque.id)
                );
                return {
                  ...mosque,
                  prayerTimes: prayerTime || mosque.prayerTimes, // Garder l'ancien si pas trouvé
                };
              });

              // Mettre à jour l'affichage
              this.populateMosqueSelect(this.currentMosques);
              this.displayAllMosques();

              const newMosquesWithoutTimes = this.currentMosques.filter(
                (mosque) => !mosque.prayerTimes
              );
              console.log(
                `[DEBUG] WelcomeMosqueTime: Après retry: ${newMosquesWithoutTimes.length}/${totalMosques} mosquées sans horaires`
              );
            } catch (retryError) {
              console.error(
                "[DEBUG] WelcomeMosqueTime: Erreur lors du retry:",
                retryError
              );
            }
          }, 3000);
        } else {
          this._hasRetriedForCity = false; // Reset pour la prochaine ville
        }

        // Mettre à jour l'interface
        this.populateMosqueSelect(this.currentMosques);
        this.displayAllMosques();
        this.updateDateDisplay(cityName);
        localStorage.setItem("lastSelectedCity", cityName);

        // Vérifier quel onglet est actif et mettre à jour l'affichage
        const activeTab = document.querySelector(".mosquetime-tab.active");
        if (activeTab) {
          this.switchTab(activeTab.dataset.tab);
        }

        // Stocker les données dans localStorage
        console.log(
          "[DEBUG] WelcomeMosqueTime: Sauvegarde des données en cache pour",
          cityName
        );
        mosqueTimesStorageService.saveCityData(cityName, {
          currentMosques: this.currentMosques,
        });

        notificationService.show("mosque.city.selected", "success");
      } catch (error) {
        console.warn(
          "[DEBUG] WelcomeMosqueTime: Erreur lors de la récupération des données:",
          error
        );
        this.displayDefaultState();
      }
    } catch (error) {
      console.warn(
        "[DEBUG] WelcomeMosqueTime: Error in city selection:",
        error
      );
      this.displayDefaultState();
    }
  }

  // Nouvelle méthode pour afficher un état spécifique quand l'authentification est requise
  displayAuthRequiredState(cityName) {
    // Mettre à jour l'affichage de la date avec la ville sélectionnée
    this.updateDateDisplay(cityName);
    localStorage.setItem("lastSelectedCity", cityName);

    // Afficher un message spécifique dans le conteneur des mosquées
    const allMosquesContainer = document.getElementById(
      "welcome-mosquetime-all-mosques"
    );
    const singleMosqueContainer = document.getElementById(
      "welcome-mosquetime-single-mosque"
    );

    if (allMosquesContainer) {
      allMosquesContainer.innerHTML = `
        <div class="auth-required-message">
          <p>
            <strong>${
              this.texts.authRequired || "Authentication Required"
            }</strong>
          </p>
          <p>${
            this.texts.authRequiredDescription ||
            "Please log in to view mosque prayer times."
          }</p>
          <button class="btn btn-primary login-btn" onclick="document.getElementById('login-btn').click()">
            ${this.texts.loginButton || "Log In"}
          </button>
        </div>
      `;
    }

    if (singleMosqueContainer) {
      singleMosqueContainer.innerHTML = allMosquesContainer.innerHTML;
    }

    // Activer l'onglet All Mosques
    this.setDefaultTab();
  }

  displayDefaultState() {
    // Afficher un état par défaut pour les utilisateurs non connectés
    const container = document.querySelector(".mosque-list-container");
    if (container) {
      container.innerHTML = `
        <div class="mosque-default-state">
          <p>Connectez-vous pour voir les horaires des mosquées</p>
        </div>
      `;
    }
  }

  async checkAndUpdateData() {
    try {
      const date = getCurrentDateString();
      console.log("[WelcomeMosqueTime] Vérification des données pour:", date);

      // ÉTAPE 1: Vérifier si les données existent (garder exists tel quel)
      const response = await this.fetchData(`exists/${date}`);
      console.log("[WelcomeMosqueTime] Réponse exists:", response);

      // ÉTAPE 2: Si les données n'existent pas, déclencher scraping + polling
      if (!response.exists) {
        console.log(
          "[WelcomeMosqueTime] Données absentes, démarrage scraping avec surveillance automatique"
        );

        if (typeof notificationService !== "undefined") {
          notificationService.show("mosque.scraping.started", "info");
        }

        try {
          // Déclencher le scraping en arrière-plan (ne pas attendre)
          console.log(
            "[WelcomeMosqueTime] Déclenchement du scraping en arrière-plan..."
          );
          this.fetchData("scrape-all-and-wait").catch((error) => {
            console.error(
              "[WelcomeMosqueTime] Erreur scraping arrière-plan:",
              error
            );
            if (typeof notificationService !== "undefined") {
              notificationService.show("mosque.scraping.failed", "error");
            }
          });

          // NE PAS arrêter le polling ici - il continue jusqu'à completion-status
          console.log(
            "[WelcomeMosqueTime] Surveillance active, polling en cours..."
          );
        } catch (scrapingError) {
          console.error(
            "[WelcomeMosqueTime] Erreur pendant le déclenchement du scraping:",
            scrapingError
          );

          if (typeof notificationService !== "undefined") {
            notificationService.show("mosque.scraping.failed", "error");
          }
        }
      } else {
        console.log(
          "[WelcomeMosqueTime] Données existantes, rafraîchissement depuis DB"
        );

        // Vider le cache pour forcer la récupération depuis la DB
        if (typeof mosqueTimesStorageService !== "undefined") {
          console.log(
            "[WelcomeMosqueTime] Nettoyage du cache pour récupération fraîche..."
          );
          mosqueTimesStorageService.clearAllData();
        }

        // Charger les données pour la ville actuelle depuis la DB
        const currentCity = this.getCurrentCity();
        if (currentCity) {
          console.log(
            `[WelcomeMosqueTime] Chargement des données fraîches pour: ${currentCity}`
          );
          await this.handleCitySelection(currentCity);
        }
      }
    } catch (error) {
      console.error(
        "[WelcomeMosqueTime] Erreur lors de la vérification:",
        error
      );

      if (typeof notificationService !== "undefined") {
        notificationService.show("mosque.error.general", "error");
      }
    }
  }

  getCurrentCity() {
    const citySelect = document.getElementById("welcome-mosquetime-city");
    return citySelect
      ? citySelect.value
      : localStorage.getItem("lastSelectedCity");
  }

  updateDateDisplay(selectedCity = null) {
    const cityDateElement = document.getElementById(
      "welcome-mosquetime-city-date"
    );
    const citySelect = document.getElementById("welcome-mosquetime-city");

    if (cityDateElement) {
      const date = new Date(); // Toujours utiliser la date actuelle
      // Utiliser la ville passée en paramètre ou celle du select
      const cityName =
        selectedCity ||
        (citySelect && citySelect.value) ||
        this.texts.selectCity;

      // Formater la date selon la langue actuelle
      const locale = this.currentLang === "fr" ? "fr-FR" : "en-US";
      const formattedDate = date.toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      cityDateElement.textContent = `${cityName}, ${formattedDate}`;
    }
  }

  getFormattedDate() {
    // Cette méthode est pour l'affichage uniquement
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const formattedDate = this.currentDate.toLocaleDateString(
      this.currentLang === "fr" ? "fr-FR" : "en-US",
      options
    );
    return formattedDate;
  }

  // Test simple de la nouvelle approche
  // Méthodes de test supprimées - utilisées uniquement en développement

  // Méthode simple pour rafraîchir les données
  async refreshData() {
    try {
      console.log("🔄 Rafraîchissement des données...");

      const currentCity = this.getCurrentCity();
      if (!currentCity) {
        console.log("ℹ️ Aucune ville sélectionnée pour le rafraîchissement");
        return;
      }

      // ✅ CORRECTION MAJEURE : Nettoyer TOUT le cache car le scraping global a mis à jour toutes les villes
      console.log("🧹 Nettoyage complet du cache après scraping global...");
      mosqueTimesStorageService.clearAllData();

      // ✅ OPTIMISATION : Réduire le délai de 5 à 2 secondes pour une meilleure UX
      console.log(
        "⏳ Délai de sécurité de 2 secondes pour finalisation complète des données..."
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Recharger les données de la ville actuelle depuis l'API
      console.log("📥 Rechargement des données depuis l'API...");
      await this.handleCitySelection(currentCity);

      console.log("✅ Rafraîchissement terminé avec succès");
    } catch (error) {
      console.error("❌ Erreur lors du rafraîchissement:", error);
    }
  }

  // ===== NOUVELLES MÉTHODES POUR LA DÉTECTION AUTOMATIQUE =====

  /**
   * Configure les écouteurs d'événements pour le scraping automatique
   */
  setupScrapingEventListeners() {
    console.log(
      "[WelcomeMosqueTime] Configuration des écouteurs d'événements de scraping"
    );

    // Écouter les événements de scraping si ils sont émis par le backend
    window.addEventListener("scrapingStarted", (event) => {
      this.handleScrapingStarted(event.detail);
    });

    window.addEventListener("scrapingCompleted", (event) => {
      this.handleScrapingCompleted(event.detail);
    });

    window.addEventListener("scrapingFailed", (event) => {
      this.handleScrapingFailed(event.detail);
    });
  }

  /**
   * Gère le début du scraping
   */
  handleScrapingStarted(data) {
    console.log("[WelcomeMosqueTime] Scraping démarré:", data);

    // Afficher la notification
    if (typeof notificationService !== "undefined") {
      notificationService.show("mosque.scraping.started", "info");
    }

    // ✅ Démarrer l'attente IMMÉDIATE de la fin réelle du scraping
    this.waitForScrapingCompletion();
  }

  /**
   * Gère la fin du scraping avec succès
   */
  async handleScrapingCompleted(data) {
    console.log("[WelcomeMosqueTime] Scraping terminé avec succès:", data);

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
    console.log("[WelcomeMosqueTime] Scraping échoué:", data);

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
      `[WelcomeMosqueTime] 📡 Attente RÉELLE de fin de scraping pour ${date}`
    );

    try {
      // ✅ Long Polling - cette requête ne se termine que quand le scraping est vraiment fini
      this.waitRequest = this.fetchData(`wait-scraping-completion/${date}`);
      const response = await this.waitRequest;

      if (response.success) {
        console.log(
          `[WelcomeMosqueTime] 🎉 Notification de fin reçue:`,
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
            `[WelcomeMosqueTime] ⚠️ Scraping terminé mais données non disponibles`
          );
        }
      } else if (response.status === "timeout") {
        console.log(
          `[WelcomeMosqueTime] ⏰ Timeout de l'attente - pas critique`
        );
      } else {
        console.log(
          `[WelcomeMosqueTime] ℹ️ Réponse d'attente:`,
          response.message
        );
      }
    } catch (error) {
      // Si l'erreur n'est pas due à une annulation
      if (error.name !== "AbortError") {
        console.error(
          "[WelcomeMosqueTime] ❌ Erreur attente completion:",
          error
        );
      } else {
        console.log("[WelcomeMosqueTime] 🚫 Attente annulée (normal)");
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
        "[WelcomeMosqueTime] 🚫 Annulation de l'attente Long Polling"
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
      "[WelcomeMosqueTime] Invalidation du cache et rafraîchissement des données"
    );

    try {
      // ✅ CORRECTION CRITIQUE : Mettre à jour la date courante avant le rafraîchissement
      console.log("[WelcomeMosqueTime] Mise à jour de la date courante...");
      this.currentDate = new Date();
      const newDate = getCurrentDateString();
      console.log(`[WelcomeMosqueTime] Date mise à jour: ${newDate}`);

      // ✅ DÉLAI DE SÉCURITÉ : Attendre que toutes les transactions DB soient committées
      console.log(
        "[WelcomeMosqueTime] ⏳ Délai de sécurité de 3 secondes pour finalisation des transactions DB..."
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Vider tout le cache
      if (typeof mosqueTimesStorageService !== "undefined") {
        console.log("[WelcomeMosqueTime] Suppression du cache...");
        mosqueTimesStorageService.clearAllData();

        if (typeof notificationService !== "undefined") {
          notificationService.show("mosque.cache.cleared", "success");
        }
      }

      // Recharger les données pour la ville actuelle
      const currentCity = this.getCurrentCity();
      if (currentCity) {
        console.log(
          `[WelcomeMosqueTime] Rechargement des données pour ${currentCity} à la date ${newDate}`
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
        "[WelcomeMosqueTime] Erreur lors du rafraîchissement:",
        error
      );

      if (typeof notificationService !== "undefined") {
        notificationService.show("mosque.refresh.failed", "error");
      }
    }
  }
}
