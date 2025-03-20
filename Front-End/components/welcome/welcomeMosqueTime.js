import { MosqueTimeManager } from "../prayer/mosqueTime.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import { api } from "../../services/api/dynamicLoader.js";
import CacheService, {
  getMidnightTimestamp,
} from "../../services/cache/cacheMosqueTime.js";
import { API_BASE_URL } from "../../config/apiConfig.js";

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

    console.log("WelcomeMosqueTime: Setting up HTML structure");
    this.updateInterface();

    console.log("WelcomeMosqueTime: Setting up event listeners");
    this.setupEventListeners();

    console.log("WelcomeMosqueTime: Loading cities");
    await this.loadCities();

    console.log("WelcomeMosqueTime: Checking and updating data");
    await this.checkAndUpdateData();

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
    console.log("WelcomeMosqueTime: Formatting prayer times:", times);
    if (!times) {
      console.warn("WelcomeMosqueTime: No prayer times provided");
      return `<p>${this.texts.prayerNotAvailable}</p>`;
    }

    const prayerTimes = times.prayer_times || times;

    // Fonction pour formater l'heure sans les secondes
    const formatTime = (time) => {
      if (!time) return "--:--";
      return time.substring(0, 5); // Garde uniquement HH:MM
    };

    return `
        <div class="prayer-times-grid">
            <div class="prayer-item">
                <span class="prayer-label">Fajr</span>
                <span class="jamaa-time">${formatTime(prayerTimes.fajr)}</span>
            </div>
            <div class="prayer-item">
                <span class="prayer-label">Dhuhr</span>
                <span class="jamaa-time">${formatTime(prayerTimes.dhuhr)}</span>
            </div>
            <div class="prayer-item">
                <span class="prayer-label">Asr</span>
                <span class="jamaa-time">${formatTime(prayerTimes.asr)}</span>
            </div>
            <div class="prayer-item">
                <span class="prayer-label">Maghrib</span>
                <span class="jamaa-time">${formatTime(
                  prayerTimes.maghrib
                )}</span>
            </div>
            <div class="prayer-item">
                <span class="prayer-label">Isha</span>
                <span class="jamaa-time">${formatTime(prayerTimes.isha)}</span>
            </div>
        </div>
        <div class="additional-times-grid">
            <div class="prayer-item">
                <span class="prayer-label">Jumuah1</span>
                <span class="jamaa-time">${formatTime(
                  prayerTimes.jumuah1
                )}</span>
            </div>
            <div class="prayer-item">
                <span class="prayer-label">Jumuah2</span>
                <span class="jamaa-time">${formatTime(
                  prayerTimes.jumuah2
                )}</span>
            </div>
            <div class="prayer-item">
                <span class="prayer-label">Jumuah3</span>
                <span class="jamaa-time">${formatTime(
                  prayerTimes.jumuah3
                )}</span>
            </div>
            <div class="prayer-item">
                <span class="prayer-label">Jumuah4</span>
                <span class="jamaa-time">${formatTime(
                  prayerTimes.jumuah4
                )}</span>
            </div>
            <div class="prayer-item">
                <span class="prayer-label">Tarawih</span>
                <span class="jamaa-time">${formatTime(
                  prayerTimes.tarawih
                )}</span>
            </div>
        </div>
    `;
  }

  // Surcharge pour l'affichage des mosquées
  async displayAllMosques() {
    console.log("WelcomeMosqueTime: Displaying all mosques");
    const grid = document.getElementById("welcome-mosquetime-grid");
    if (!grid) {
      console.error("WelcomeMosqueTime: Grid element not found");
      return;
    }
    if (!this.currentMosques.length) {
      console.warn("WelcomeMosqueTime: No mosques to display");
      return;
    }

    grid.innerHTML =
      `<div class="scrollable-content">` +
      this.currentMosques
        .map(
          (mosque) => `
    <div class="mosquetime-mosque-card">
      <h3 class="mosque-name">${mosque.name}</h3>
      <p class="mosque-address">${mosque.address}</p>
      <div class="mosque-prayer-times">
        ${this.formatPrayerTimes(mosque.prayerTimes)}
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
                <div class="mosque-info">
                    <h3 class="mosque-name">${selectedMosque.name}</h3>
                    <p class="mosque-address">${selectedMosque.address}</p>
                </div>
            </div>
            <div class="mosque-prayer-times">
                ${this.formatPrayerTimes(selectedMosque.prayerTimes)}
            </div>
        </div>
    `;
  }

  // Surcharge de handleCitySelection pour gérer le cas public
  async handleCitySelection(cityName) {
    try {
      console.log(
        "[DEBUG] WelcomeMosqueTime: Handling city selection for",
        cityName
      );

      try {
        // Correction: ajouter un slash au début du chemin
        const mosques = await api.get(
          `/mosque-times/cities/${encodeURIComponent(cityName)}/mosques`
        );

        if (!mosques || mosques.length === 0) {
          console.log("WelcomeMosqueTime: No mosques found for city", cityName);
          return;
        }

        // Correction: ajouter un slash au début du chemin
        const date = this.getCurrentDateString();
        const prayerTimesData = await api.get(
          `/mosque-times/cities/${encodeURIComponent(
            cityName
          )}/date/${date}/prayer-times`
        );

        // Associer les horaires aux mosquées
        this.currentMosques = mosques.map((mosque) => {
          const prayerTime = prayerTimesData.prayerTimes?.find(
            (pt) => String(pt.mosque_id) === String(mosque.id)
          );
          return {
            ...mosque,
            prayerTimes: prayerTime || null,
          };
        });

        // Mettre à jour l'interface
        this.populateMosqueSelect(this.currentMosques);

        // Appeler displayAllMosques au lieu de updateAllMosques
        this.displayAllMosques();

        this.updateDateDisplay(cityName);
        localStorage.setItem("lastSelectedCity", cityName);

        // Vérifier quel onglet est actif et mettre à jour l'affichage en conséquence
        const activeTab = document.querySelector(".mosquetime-tab.active");
        if (activeTab) {
          this.switchTab(activeTab.dataset.tab);
        }
      } catch (error) {
        // Si on reçoit une erreur 401, on affiche un message adapté pour les utilisateurs non connectés
        if (error.message && error.message.includes("401")) {
          console.log(
            "[DEBUG] WelcomeMosqueTime: Authentication required for this endpoint"
          );
          this.displayAuthRequiredState(cityName);
          return;
        }
        throw error;
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
      const date = this.getCurrentDateString();

      // Correction: ajouter un slash au début du chemin
      const dataExists = await api.get(`/mosque-times/exists/${date}`);

      if (!dataExists.exists) {
        console.log("WelcomeMosqueTime: No data found, reporting missing data");

        // Correction: ajouter un slash au début du chemin
        await api.post(`/mosque-times/report-missing-data/${date}`, {
          source: "welcome-page",
        });

        // Informer l'utilisateur que les données sont en cours de génération
        notificationService.show("mosque.data.updating", "info");
      }
    } catch (error) {
      console.error("WelcomeMosqueTime: Error checking data:", error);
      notificationService.show("mosque.data.error", "warning");
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
    if (!pos1 || !pos2) return Infinity;

    const R = 6371; // Rayon de la Terre en km
    const lat1 = this.toRad(pos1.latitude);
    const lat2 = this.toRad(pos2.latitude);
    const dLat = this.toRad(pos2.latitude - pos1.latitude);
    const dLon = this.toRad(pos2.longitude - pos1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(value) {
    return (value * Math.PI) / 180;
  }
}
