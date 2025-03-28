import { api } from "../../services/api/dynamicLoader.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import CacheService, {
  getMidnightTimestamp,
} from "../../services/cache/cacheMosqueTime.js";
import mosqueTimesStorageService from "../../services/cache/mosqueTimesStorageService.js";

export class MosqueTimeManager {
  constructor() {
    this.currentMosques = [];
    this.sortOrder = "asc";
    this.selectedCity = "";
    this.lastDate = null;
    this.currentDate = new Date();

    // Initialiser les textes par défaut
    this.texts = this.getLocalizedTexts();

    document.addEventListener("languageChanged", (event) => {
      // Mettre à jour les textes lors du changement de langue
      this.texts = this.getLocalizedTexts();
      this.updateDateDisplay();
      this.populateMosqueSelect(this.currentMosques);
      const mosqueSelect = document.getElementById("mosquetime-mosque-select");
      if (mosqueSelect && !mosqueSelect.value) {
        this.updateSingleMosqueTimes();
      }
    });
  }

  // Méthode pour obtenir les textes localisés
  getLocalizedTexts() {
    const lang = localStorage.getItem("userLang") || "en";
    return {
      selectMosqueToView:
        lang === "fr"
          ? "Veuillez sélectionner une mosquée pour voir ses horaires de prière"
          : "Please select a mosque to view prayer times",
      noMosqueFound:
        lang === "fr" ? "Aucune mosquée trouvée" : "No mosque found",
      dateTitle: lang === "fr" ? "Horaires pour le" : "Prayer times for",
      loading: lang === "fr" ? "Chargement..." : "Loading...",
      // Ajouter d'autres textes au besoin
    };
  }

  // --- Point d'entrée principal ---
  async initialize() {
    try {
      console.log("Initializing mosqueTime module");
      this.updateDateDisplay();
      await this.checkAndUpdateData();
      this.setupEventListeners();
      await this.loadCities();
      await this.loadLastSelectedCity();
      this.switchTab("all");

      // Ajouter les styles personnalisés
      this.addCustomStyles();
    } catch (error) {
      if (error.message.includes("token")) {
        window.location.href = "/login";
      }
      console.error("Erreur d'initialisation:", error);
    }
  }

  // Nouvelle méthode pour ajouter les styles personnalisés
  addCustomStyles() {
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .mosque-info-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        margin-bottom: 10px;
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

  // Nouvelle méthode pour créer des liens de navigation à partir d'une adresse
  createMapsLink(address, name) {
    if (!address) return "";
    // Encoder l'adresse et le nom pour l'URL
    const encodedAddress = encodeURIComponent(`${name}, ${address}`);
    return `https://maps.google.com/?q=${encodedAddress}`;
  }

  // Méthode pour référencer l'icône SVG externe
  createNavigationIconSVG() {
    // Utiliser le fichier SVG dans les assets
    return `<img src="/assets/icons/navmap-icone.svg" class="navigation-icon" alt="Icône de navigation routière">`;
  }

  // --- Vérification et mise à jour des données si nécessaire ---
  async checkAndUpdateData() {
    try {
      const date = this.getCurrentDateString();
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

  // --- Helper to get current date as string ---
  getCurrentDateString() {
    return this.currentDate.toISOString().split("T")[0];
  }

  // --- Déclencher le scraping pour toutes les villes ---
  async triggerScrapingForAllCities() {
    try {
      console.log("Starting scraping for all cities");
      const data = await api.post("/mosque-times/scrape-all");

      if (data.hasErrors) {
        // Afficher une seule notification d'erreur générique
        notificationService.show("mosque.scrape.partial_error", "warning");
      } else {
        notificationService.show("mosque.data.updated", "success");
      }

      console.log("Scraping completed:", data.message);
      return data;
    } catch (error) {
      console.error("Erreur lors du scraping:", error);
      // Une seule notification d'erreur critique
      notificationService.show("mosque.scrape.error", "error", 0);
      throw error;
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
      const lastCity = localStorage.getItem("lastSelectedCity");
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

  // --- Formatage de l'heure (ex. "HH:mm" ou "--:--") ---
  formatTime(timeString) {
    if (!timeString || timeString === "--:--") return "--:--";
    if (timeString.includes(":")) {
      return timeString.split(":").slice(0, 2).join(":");
    }
    return timeString;
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
                    <span class="jamaa-time">${this.formatTime(
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
                    <span class="jamaa-time">${this.formatTime(
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
                <a href="${this.createMapsLink(
                  mosque.address,
                  mosque.name
                )}" target="_blank" class="mosque-directions-link" title="Obtenir l'itinéraire">
                  ${this.createNavigationIconSVG()}
                </a>
              </div>
              <div class="mosque-prayer-times">
                ${this.formatPrayerTimes(mosque.prayerTimes)}
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
      const date = mosqueTimesStorageService.getCurrentDateString();

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

      // Mettre à jour l'interface
      this.populateMosqueSelect(this.currentMosques);

      // Stocker dans le localStorage
      mosqueTimesStorageService.saveCityData(cityName, {
        currentMosques: this.currentMosques,
      });

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
        localStorage.setItem("lastSelectedCity", this.selectedCity);
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
  formatPrayerTimes(times) {
    if (!times) return "<p>Horaires non disponibles</p>";

    const formatTime = (time) => {
      if (!time) return "--:--";

      // Si le format est HH:MM:SS, extraire uniquement HH:MM
      if (time.includes(":")) {
        const parts = time.split(":");
        if (parts.length >= 2) {
          return `${parts[0]}:${parts[1]}`;
        }
      }

      return time;
    };

    const mainPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    let mainPrayerTimesHTML = mainPrayers
      .map(
        (prayer) => `
            <div class="prayer-item">
                <div class="prayer-name">
                    <span class="prayer-label">${
                      prayer.charAt(0).toUpperCase() + prayer.slice(1)
                    }</span>
                    <span class="jamaa-time">${formatTime(times[prayer])}</span>
                </div>
            </div>
        `
      )
      .join("");

    const additionalPrayers = [
      "jumuah1",
      "jumuah2",
      "jumuah3",
      "jumuah4",
      "tarawih",
    ];
    let additionalPrayerTimesHTML = additionalPrayers
      .map(
        (prayer) => `
            <div class="prayer-item">
                <div class="prayer-name">
                    <span class="prayer-label">${
                      prayer.charAt(0).toUpperCase() + prayer.slice(1)
                    }</span>
                    <span class="jamaa-time">${formatTime(times[prayer])}</span>
                </div>
            </div>
        `
      )
      .join("");

    return `
        <div class="prayer-times-grid">
            ${mainPrayerTimesHTML}
        </div>
        <div class="additional-times-grid">
            ${additionalPrayerTimesHTML}
        </div>
    `;
  }
}

// --- Export de la fonction d'initialisation ---
export function initializeMosqueTime() {
  const mosqueTimeManager = new MosqueTimeManager();
  return mosqueTimeManager.initialize();
}
