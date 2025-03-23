import { api } from "../../services/api/dynamicLoader.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import CacheService, {
  getMidnightTimestamp,
} from "../../services/cache/cacheMosqueTime.js";
import mosqueTimesStorageService from '../../services/cache/mosqueTimesStorageService.js';

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
      selectMosqueToView: lang === "fr" 
        ? "Veuillez sélectionner une mosquée pour voir ses horaires de prière" 
        : "Please select a mosque to view prayer times",
      noMosqueFound: lang === "fr"
        ? "Aucune mosquée trouvée"
        : "No mosque found",
      dateTitle: lang === "fr"
        ? "Horaires pour le"
        : "Prayer times for",
      loading: lang === "fr"
        ? "Chargement..."
        : "Loading...",
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
    } catch (error) {
      if (error.message.includes("token")) {
        window.location.href = "/login";
      }
      console.error("Erreur d'initialisation:", error);
    }
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
                <div class="prayer-label">${
                  prayer.charAt(0).toUpperCase() + prayer.slice(1)
                }</div>
                <div class="jamaa-time">${this.formatTime(times[prayer])}</div>
            </div>
        `
      )
      .join("");

    let additionalPrayerTimesHTML = additionalPrayers
      .map(
        (prayer) => `
            <div class="prayer-item">
                <div class="prayer-label">${
                  prayer.charAt(0).toUpperCase() + prayer.slice(1)
                }</div>
                <div class="jamaa-time">${this.formatTime(times[prayer])}</div>
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
    // Vérifier les deux noms de conteneurs possibles
    const allMosquesContainer = document.getElementById("mosquetime-all-mosques-list") || 
                               document.getElementById("mosquetime-all-mosques-container");
    
    if (!allMosquesContainer) {
      console.log("Conteneur all-mosques non trouvé, opération ignorée");
      return;
    }

    allMosquesContainer.innerHTML = "";

    this.currentMosques.forEach((mosque) => {
      const prayerTimes = mosque.prayerTimes || {};
      const card = document.createElement("div");
      card.className = "mosquetime-mosque-card";

      const mainPrayers = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
      let mainPrayerTimesHTML = mainPrayers
        .map(
          (prayer) => `
                <div class="prayer-item">
                    <div class="prayer-label">${
                      prayer.charAt(0).toUpperCase() + prayer.slice(1)
                    }</div>
                    <div class="jamaa-time">${this.formatTime(
                      prayerTimes[prayer]
                    )}</div>
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
                    <div class="prayer-label">${
                      prayer.charAt(0).toUpperCase() + prayer.slice(1)
                    }</div>
                    <div class="jamaa-time">${this.formatTime(
                      prayerTimes[prayer]
                    )}</div>
                </div>
            `
        )
        .join("");

      card.innerHTML = `
                <div class="mosque-header">
                    <div class="mosque-image"></div>
                    <div class="mosque-info">
                        <h3 class="mosque-name">${mosque.name}</h3>
                        <div class="mosque-address">${
                          mosque.address || ""
                        }</div>
                    </div>
                </div>
                <div class="prayer-times-grid">
                    ${mainPrayerTimesHTML}
                </div>
                <div class="additional-times-grid">
                    ${additionalPrayerTimesHTML}
                </div>
            `;

      allMosquesContainer.appendChild(card);
    });
  }

  // --- Mettre à jour l'affichage de la mosquée sélectionnée (single) ---
  async updateSingleMosqueTimes() {
    try {
      const singleMosqueContainer = document.getElementById("mosquetime-single-mosque");
      if (!singleMosqueContainer) {
        console.log("Conteneur single-mosque non trouvé, opération ignorée");
        return;
      }
      
      const mosqueSelect = document.getElementById("mosquetime-mosque-select");
      if (!mosqueSelect) {
        console.log("Select de mosquée non trouvé, opération ignorée");
        return;
      }
      
      const selectedMosqueId = mosqueSelect.value;
      console.log("Selected Mosque ID:", selectedMosqueId);
      console.log("Current Mosques:", this.currentMosques);
      
      if (!selectedMosqueId) {
        singleMosqueContainer.innerHTML = 
          `<div class="no-mosque-selected">${this.texts.selectMosqueToView}</div>`;
        return;
      }
      
      // Trouver la mosquée dans les données déjà chargées
      const selectedMosque = this.currentMosques.find(
        (m) => String(m.id) === String(selectedMosqueId)
      );
      
      if (!selectedMosque) {
        console.error("Mosquée non trouvée dans les données chargées");
        return;
      }
      
      // Utiliser directement les données de prayerTimes déjà associées à la mosquée
      const template = `
        <div class="single-mosque-container">
          <div class="mosque-header">
            <h3>${selectedMosque.name}</h3>
            <p class="mosque-address">${selectedMosque.address}</p>
          </div>
          <div class="prayer-times-container">
            ${this.formatPrayerTimes(selectedMosque.prayerTimes)}
          </div>
        </div>
      `;
      
      singleMosqueContainer.innerHTML = template;
    } catch (error) {
      console.error("Erreur lors de la mise à jour des horaires:", error);
    }
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
        `/mosque-times/cities/${encodeURIComponent(cityName)}/date/${date}/prayer-times`
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
        currentMosques: this.currentMosques
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
      if (typeof this.updateDateDisplay === 'function') {
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
}

// --- Export de la fonction d'initialisation ---
export function initializeMosqueTime() {
  const mosqueTimeManager = new MosqueTimeManager();
  return mosqueTimeManager.initialize();
}
