// duaTimeCalculator.js
import { api } from "../../services/api/dynamicLoader.js";
import { notificationService } from "../../services/notifications/notificationService.js";

export class DuaTimeCalculator {
  constructor() {
    this.method = "3"; // Méthode par défaut
    this.initialized = false; // Flag pour s'assurer que l'initialisation ne se fait qu'une seule fois
  }

  async initialize() {
    // Si déjà initialisé, ne pas ré-attacher les écouteurs
    if (this.initialized) {
      console.log('DuaTimeCalculator déjà initialisé.');
      return;
    }
    console.log('Initializing duaTime calculator');
    this.setupEventListeners();
    this.initialized = true;
  }

  // --- Mise en place des écouteurs d'événements sur la page ---
  setupEventListeners() {
    const duaTimeSection = document.getElementById('duaTimeCalculator');
    if (duaTimeSection) {
      // On utilise une méthode séparée pour le callback et on le lie au contexte courant.
      duaTimeSection.addEventListener('click', this.handleClick.bind(this));
    }

    // Sélection de la méthode de calcul
    const methodSelect = document.getElementById('duaMethodSelect');
    if (methodSelect) {
      methodSelect.addEventListener('change', this.toggleDuaCustomMethodInput.bind(this));
    }
  }

  // Gestion centralisée du clic sur la section du calculateur
  handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (target) {
      const action = target.getAttribute('data-action');
      switch (action) {
        case 'get-dua-location':
          this.getDuaLocation();
          break;
        case 'use-dua-city':
          this.useDuaCity();
          break;
        case 'calculate-dua-manually':
          this.calculateDuaManually();
          break;
        default:
          console.warn('Action inconnue :', action);
      }
    }
  }

  // --- Récupérer la position de l'utilisateur (géolocalisation) ---
  async getDuaLocation() {
    if (!navigator.geolocation) {
      notificationService.show('dua.geolocation.unsupported', 'error', 0);
      return;
    }

    notificationService.show('dua.geolocation.searching', 'info');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await this.fetchPrayerTimesByCoordinates(latitude, longitude);
          notificationService.show('dua.times.loaded', 'success');
        } catch (error) {
          console.error('Error getting prayer times:', error);
          notificationService.show('dua.times.error', 'error', 0);
        }
      },
      (error) => this.handleGeolocationError(error)
    );
  }

  // --- Gestion des erreurs de géolocalisation ---
  handleGeolocationError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        notificationService.show('dua.geolocation.denied', 'error', 0);
        break;
      case error.POSITION_UNAVAILABLE:
        notificationService.show('dua.geolocation.unavailable', 'error', 0);
        break;
      case error.TIMEOUT:
        notificationService.show('dua.geolocation.timeout', 'error', 0);
        break;
      default:
        notificationService.show('dua.geolocation.error', 'error', 0);
    }
  }

  // --- Utiliser la ville saisie par l'utilisateur ---
  async useDuaCity() {
    const city = document.getElementById('duaCityInput').value;
    if (!city) {
      notificationService.show('dua.city.empty', 'warning');
      return;
    }

    let method = document.getElementById('duaMethodSelect').value;
    let customParams = new URLSearchParams();
    customParams.append('method', method);

    // Méthode personnalisée (fajr/isha angles)
    if (method === "24") {
      const fajrAngle = document.getElementById('duaFajrAngleInput').value;
      const ishaAngle = document.getElementById('duaIshaAngleInput').value;
      if (fajrAngle && ishaAngle) {
        customParams.append('fajrAngle', fajrAngle);
        customParams.append('ishaAngle', ishaAngle);
      } else {
        notificationService.show('dua.angles.required', 'warning');
        return;
      }
    }

    try {
      notificationService.show('dua.times.calculating', 'info');
      const response = await api.get(
        `/dua-time/prayer-times/city/${encodeURIComponent(city)}?${customParams}`
      );

      const { Fajr, Maghrib } = response.timings;
      document.getElementById('duaManualFajrInput').value = Fajr.slice(0, 5);
      document.getElementById('duaManualMaghribInput').value = Maghrib.slice(0, 5);
      this.calculateDuaLastThird(Fajr, Maghrib, 'auto');
      notificationService.show('dua.times.loaded', 'success');
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      notificationService.show('dua.city.notfound', 'error', 0);
    }
  }

  // --- Récupération des horaires par coordonnées ---
  async fetchPrayerTimesByCoordinates(latitude, longitude) {
    try {
      let method = document.getElementById('duaMethodSelect').value;
      let params = new URLSearchParams({
        latitude,
        longitude,
        method
      });

      // Méthode personnalisée (fajr/isha angles)
      if (method === "24") {
        const fajrAngle = document.getElementById('duaFajrAngleInput').value;
        const ishaAngle = document.getElementById('duaIshaAngleInput').value;
        if (fajrAngle && ishaAngle) {
          params.append('fajrAngle', fajrAngle);
          params.append('ishaAngle', ishaAngle);
        } else {
          notificationService.show('dua.angles.required', 'warning');
          return;
        }
      }

      notificationService.show('dua.times.calculating', 'info');
      const response = await api.get(
        `/dua-time/prayer-times/coordinates?${params}`
      );

      const { Fajr, Maghrib } = response.timings;
      document.getElementById('duaManualFajrInput').value = Fajr.slice(0, 5);
      document.getElementById('duaManualMaghribInput').value = Maghrib.slice(0, 5);
      this.calculateDuaLastThird(Fajr, Maghrib, 'auto');
      notificationService.show('dua.times.loaded', 'success');
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      notificationService.show('dua.times.error', 'error', 0);
    }
  }

  // --- Calcul manuel (l'utilisateur saisit Fajr et Maghrib) ---
  calculateDuaManually() {
    try {
      const fajr = document.getElementById('duaManualFajrInput').value + ":00";
      const maghrib = document.getElementById('duaManualMaghribInput').value + ":00";
      this.calculateDuaLastThird(fajr, maghrib, 'manual');
      notificationService.show('dua.calculation.success', 'success');
    } catch (error) {
      console.error('Error in manual calculation:', error);
      notificationService.show('dua.times.error', 'error', 0);
    }
  }

  // --- Calcul du dernier tiers de la nuit ---
  calculateDuaLastThird(Fajr, Maghrib, type) {
    const [fajrHour, fajrMinute] = Fajr.split(':').map(Number);
    const [maghribHour, maghribMinute] = Maghrib.split(':').map(Number);

    const fajrDate = new Date();
    fajrDate.setHours(fajrHour, fajrMinute, 0);

    const maghribDate = new Date();
    maghribDate.setHours(maghribHour, maghribMinute, 0);

    // Durée de la nuit (entre Maghrib et Fajr)
    const nightDuration =
      (fajrDate - maghribDate + 24 * 60 * 60 * 1000) % (24 * 60 * 60 * 1000);
    const thirdOfNight = nightDuration / 3;
    const lastThirdStart = new Date(maghribDate.getTime() + 2 * thirdOfNight);

    this.updateTimeDisplay(type, Fajr, Maghrib, lastThirdStart);
  }

  // --- Mise à jour de l'UI (affichage des horaires) ---
  updateTimeDisplay(type, Fajr, Maghrib, lastThirdStart) {
    const prefix = type === "auto" ? "duaAuto" : "duaManual";
    document
      .getElementById(`${prefix}FajrTime`)
      .innerHTML = `Fajr: ${Fajr}`;
    document
      .getElementById(`${prefix}MaghribTime`)
      .innerHTML = `Maghrib: ${Maghrib}`;
    document
      .getElementById(`${prefix}LastThird`)
      .innerHTML =
      `Last third of the night starts at: <strong>${lastThirdStart.toTimeString().slice(0, 5)}</strong>`;
  }

  // --- Affichage / masquage des champs "custom method" (angles Fajr/Isha) ---
  toggleDuaCustomMethodInput() {
    const method = document.getElementById("duaMethodSelect").value;
    const customMethodDiv = document.getElementById("duaCustomMethod");
    if (customMethodDiv) {
      customMethodDiv.style.display = method === "24" ? "block" : "none";
    }
  }
}

// --- Création d'une instance et export de la fonction d'initialisation ---
const duaTimeCalculator = new DuaTimeCalculator();
export const initializeDuaTimeCalculator = () => duaTimeCalculator.initialize(); 
