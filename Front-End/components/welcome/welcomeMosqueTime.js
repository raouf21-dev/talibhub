import { MosqueTimeManager } from "../prayer/mosqueTime.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import { api } from "../../services/api/dynamicLoader.js";
import CacheService, {
  getMidnightTimestamp,
} from "../../services/cache/cacheMosqueTime.js";
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

export class WelcomeMosqueTime extends MosqueTimeManager {
  constructor() {
    super();
    console.log("WelcomeMosqueTime: Constructor called");
    this.container = document.getElementById("welcomepage-mosque-time");
    console.log("WelcomeMosqueTime: Container found:", this.container);
    this.isWelcomePage = true;
    this.apiBaseUrl = API_BASE_URL;
    this.cachePrefix = "public_";

    // Déterminer la langue actuelle
    this.currentLang = localStorage.getItem("userLang") || "en";

    // Définir les textes selon la langue
    this.texts = this.getLocalizedTexts();

    // Écouter les changements de langue
    document.addEventListener("languageChanged", (event) => {
      this.currentLang = event.detail.language;
      this.texts = this.getLocalizedTexts();
      this.updateInterface();
    });
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

    // Vérifier d'abord si des données existent pour aujourd'hui
    // et déclencher le scraping si nécessaire
    console.log("WelcomeMosqueTime: Checking for today's data in DB");
    await this.checkAndUpdateData();

    // Load cities
    console.log("WelcomeMosqueTime: Loading cities");
    await this.loadCities();

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
          hasSomeTimes = true;
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
            const distA = this.calculateDistance(position, a.coordinates);
            const distB = this.calculateDistance(position, b.coordinates);
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

  // Méthode utilitaire pour formater les horaires
  formatPrayerTimes(times) {
    if (!times) return "<p>Horaires non disponibles</p>";
    return formatPrayerTimesHTML(times);
  }

  // Nouvelle méthode utilitaire pour créer des liens de navigation à partir d'une adresse
  createMapsLink(address, name) {
    return createMapsLink(address, name);
  }

  // Méthode pour référencer l'icône SVG externe
  createNavigationIconSVG() {
    return createNavigationIconSVG();
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

    // Vérifier si les horaires sont présents
    let hasMissingTimes = false;
    let hasSomeTimes = false;

    this.currentMosques.forEach((mosque) => {
      if (!mosque.prayerTimes) {
        hasMissingTimes = true;
        console.warn(
          `[DEBUG] WelcomeMosqueTime: Mosquée ${mosque.id} (${mosque.name}) n'a pas d'horaires`
        );
      } else {
        hasSomeTimes = true;
        console.log(
          `[DEBUG] WelcomeMosqueTime: Mosquée ${mosque.id} (${mosque.name}) a des horaires`,
          mosque.prayerTimes
        );
      }
    });

    // Si toutes les mosquées n'ont pas d'horaires, essayer une dernière tentative de récupération
    if (hasMissingTimes && !hasSomeTimes && this.selectedCity) {
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
        <a href="${this.createMapsLink(
          mosque.address,
          mosque.name
        )}" target="_blank" class="mosque-directions-link" title="Obtenir l'itinéraire">
          ${this.createNavigationIconSVG()}
        </a>
      </div>
      <div class="mosque-prayer-times">
        ${
          mosque.prayerTimes
            ? this.formatPrayerTimes(mosque.prayerTimes)
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
                    <a href="${this.createMapsLink(
                      selectedMosque.address,
                      selectedMosque.name
                    )}" target="_blank" class="mosque-directions-link" title="Obtenir l'itinéraire">
                        ${this.createNavigationIconSVG()}
                    </a>
                </div>
            </div>
            <div class="mosque-prayer-times">
                ${this.formatPrayerTimes(selectedMosque.prayerTimes)}
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
      const date = this.getFormattedDate();
      console.log(
        "[DEBUG] WelcomeMosqueTime: Vérification des données pour la date:",
        date
      );

      // FORCER le scraping quelle que soit la réponse
      console.log(
        "[DEBUG] WelcomeMosqueTime: Forçage du scraping pour s'assurer d'avoir des données récentes"
      );

      try {
        // Afficher une notification de mise à jour
        notificationService.show("mosque.data.updating", "info");

        // Utiliser la route publique pour déclencher un scraping complet
        const response = await api.post(
          `/mosque-times/report-missing-data/${date}`,
          {
            source: "welcome-page-forced",
          }
        );

        console.log(
          "[DEBUG] WelcomeMosqueTime: Réponse du scraping forcé:",
          response
        );

        // Notifier l'utilisateur
        notificationService.show("mosque.data.updating.background", "info");

        // Si une ville est déjà sélectionnée, recharger ses données
        if (this.selectedCity) {
          // Vider le cache pour cette ville
          mosqueTimesStorageService.clearAllData();

          // Recharger les données
          await this.handleCitySelection(this.selectedCity);
          console.log(
            "[DEBUG] WelcomeMosqueTime: Données rechargées pour",
            this.selectedCity
          );
        } else {
          // Si aucune ville n'est sélectionnée, sélectionner Birmingham par défaut
          await this.handleCitySelection("Birmingham");
          console.log(
            "[DEBUG] WelcomeMosqueTime: Birmingham sélectionné par défaut"
          );
        }

        // Notification finale
        notificationService.show("mosque.data.updated", "success");
      } catch (error) {
        console.error(
          "[DEBUG] WelcomeMosqueTime: Erreur lors du scraping forcé:",
          error
        );

        // Tenter une dernière solution - mettre à jour manuellement le stockage
        if (this.selectedCity) {
          await this.handleCitySelection(this.selectedCity);
        } else {
          await this.handleCitySelection("Birmingham");
        }
      }
    } catch (error) {
      console.error(
        "[DEBUG] WelcomeMosqueTime: Erreur lors de la vérification des données:",
        error
      );
    }
  }

  // Fonction pour déclencher le scraping (utilise la route publique)
  async triggerScrapingForAllCities() {
    try {
      console.log("[DEBUG] WelcomeMosqueTime: Signalement pour scraping");
      const date = this.getCurrentDateString();

      // Utiliser la route publique qui ne nécessite pas d'authentification
      const response = await api.post(
        `/mosque-times/report-missing-data/${date}`,
        {
          source: "welcome-page",
        }
      );

      console.log(
        "[DEBUG] WelcomeMosqueTime: Résultat du signalement:",
        response
      );
      return response;
    } catch (error) {
      console.error(
        "[DEBUG] WelcomeMosqueTime: Erreur lors du signalement pour scraping:",
        error
      );
      throw error;
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

  calculateDistance(pos1, pos2) {
    return calculateDistance(pos1, pos2);
  }

  toRad(value) {
    return toRad(value);
  }

  // Override getCurrentDateString to use our fixed getFormattedDate method
  getCurrentDateString() {
    // Utiliser notre méthode getFormattedDate qui corrige les dates futures
    return this.getFormattedDate();
  }

  getFormattedDate() {
    const now = new Date();

    // Extraction directe des composants de date
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Janvier = 0
    const day = String(now.getDate()).padStart(2, "0");

    // Format ISO de la date (YYYY-MM-DD)
    const formattedDate = `${year}-${month}-${day}`;

    console.log(
      `[DEBUG] WelcomeMosqueTime: Date pour le scraping : ${formattedDate} (aujourd'hui)`
    );
    console.log(
      `[DEBUG] WelcomeMosqueTime: Détails de date : année=${year}, mois=${month}, jour=${day}`
    );

    // Vérification supplémentaire pour s'assurer du format valide
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      console.error(
        `[DEBUG] WelcomeMosqueTime: Format de date invalide détecté : ${formattedDate}`
      );
      // Date de secours en cas de problème
      return "2025-04-05";
    }

    return formattedDate;
  }
}
