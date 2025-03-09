import { api } from "../../services/api/dynamicLoader.js";
import { notificationService } from "../../services/notifications/notificationService.js";
import CacheService, {
  getMidnightTimestamp,
} from "../../services/cache/cacheMosqueTime.js";

export class MosqueTimeManager {
  constructor() {
    this.currentMosques = [];
    this.sortOrder = "asc";
    this.selectedCity = "";
    this.lastDate = null;
    this.currentDate = new Date();

    document.addEventListener("languageChanged", (event) => {
      this.updateDateDisplay();
      this.populateMosqueSelect(this.currentMosques);
      const mosqueSelect = document.getElementById("mosquetime-mosque-select");
      if (mosqueSelect && !mosqueSelect.value) {
        this.updateSingleMosqueTimes();
      }
    });
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
    const container = document.getElementById("mosquetime-all-mosques-list");
    if (!container) return;

    container.innerHTML = "";

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

      container.appendChild(card);
    });
  }

  // --- Mettre à jour l'affichage de la mosquée sélectionnée (single) ---
  async updateSingleMosqueTimes() {
    const select = document.getElementById("mosquetime-mosque-select");
    const container = document.getElementById("mosquetime-single-mosque");
    if (!select || !container) return;

    if (!select.value) {
      this.updateEmptyMosqueCard();
      return;
    }

    const selectedMosqueId = select.value;
    console.log("Selected Mosque ID:", selectedMosqueId);
    console.log("Current Mosques:", this.currentMosques);

    const selectedMosque = this.currentMosques.find(
      (mosque) => String(mosque.id) === String(selectedMosqueId)
    );

    if (!selectedMosque) {
      console.error("Mosquée non trouvée. ID recherché:", selectedMosqueId);
      console.error(
        "IDs disponibles:",
        this.currentMosques.map((m) => m.id)
      );
      return;
    }

    const date = this.getCurrentDateString();

    try {
      const times = await api.get(`/mosque-times/${selectedMosqueId}/${date}`);
      console.log("Times received:", times);
      console.log("Mosque info:", selectedMosque);
      this.updateMosqueCard(times, selectedMosque.name, selectedMosque.address);
    } catch (error) {
      console.error("Erreur lors de la récupération des horaires:", error);
      notificationService.show("mosque.no_times", "warning");
      this.updateEmptyMosqueCard(selectedMosque.name, selectedMosque.address);
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
  async handleCitySelection(city, forceUpdate = false) {
    // Normalisation de la ville pour créer une clé unique
    const normalizedCity = encodeURIComponent(city.trim().toLowerCase());
    const date = this.getCurrentDateString();
    // Clé de cache : combinaison normalisée de la ville et de la date
    const cacheKey = `mosqueData_${normalizedCity}_${date}`;

    if (!forceUpdate) {
      const cachedData = CacheService.getItem(cacheKey);
      if (cachedData) {
        console.log("Utilisation des données mises en cache pour", city, date);
        this.currentMosques = cachedData.currentMosques;
        this.populateMosqueSelect(this.currentMosques);
        const mosqueSelect = document.getElementById(
          "mosquetime-mosque-select"
        );
        if (mosqueSelect && this.currentMosques.length > 0) {
          mosqueSelect.value = String(this.currentMosques[0].id);
          await this.updateSingleMosqueTimes();
        }
        this.updateAllMosques();
        this.updateDateDisplay();
        notificationService.show("mosque.city.selected", "success");
        localStorage.setItem("lastSelectedCity", city);
        return;
      }
    }

    try {
      if (!city) {
        notificationService.show("mosque.no_city", "warning");
        return;
      }

      // Enregistrer la ville sélectionnée (optionnel, pour garder une trace)
      await api.post("/mosque-times/user/selected-city", { city });
      this.selectedCity = city;

      // Récupérer la liste des mosquées pour la ville sélectionnée
      const mosques = await api.get(
        `/mosque-times/cities/${encodeURIComponent(city)}/mosques`
      );
      console.log("Mosquées reçues:", mosques);

      if (mosques.length === 0) {
        notificationService.show("mosque.no_mosques", "warning");
        return;
      }

      // Récupérer les horaires de prière pour la ville et la date choisie
      const prayerTimesData = await api.get(
        `/mosque-times/cities/${encodeURIComponent(
          city
        )}/date/${date}/prayer-times`
      );
      console.log("Horaires reçus:", prayerTimesData);

      if (!prayerTimesData || !prayerTimesData.prayerTimes) {
        notificationService.show("mosque.data.error", "error", 0);
        return;
      }

      // Associer chaque mosquée à ses horaires
      this.currentMosques = mosques.map((mosque) => {
        const prayerTime = prayerTimesData.prayerTimes.find(
          (pt) => String(pt.mosque_id) === String(mosque.id)
        );
        return {
          ...mosque,
          prayerTimes: prayerTime || null,
        };
      });

      console.log("Mosquées traitées:", this.currentMosques);
      this.populateMosqueSelect(this.currentMosques);

      if (this.currentMosques.length > 0) {
        const mosqueSelect = document.getElementById(
          "mosquetime-mosque-select"
        );
        if (mosqueSelect) {
          mosqueSelect.value = String(this.currentMosques[0].id);
          await this.updateSingleMosqueTimes();
        }
      }

      this.updateAllMosques();
      this.updateDateDisplay();

      // Enregistrer les données en cache jusqu'à minuit
      CacheService.setItem(
        cacheKey,
        { currentMosques: this.currentMosques },
        getMidnightTimestamp()
      );
      localStorage.setItem("lastSelectedCity", city);
      notificationService.show("mosque.city.selected", "success");
    } catch (error) {
      console.error("Erreur lors de la sélection de la ville:", error);
      notificationService.show("mosque.city.error", "error", 0);
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
}

// --- Export de la fonction d'initialisation ---
export function initializeMosqueTime() {
  const mosqueTimeManager = new MosqueTimeManager();
  return mosqueTimeManager.initialize();
}
