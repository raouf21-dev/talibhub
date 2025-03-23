import mosqueTimesStorageService from '../../services/mosqueTimesStorageService.js';

// Dans la méthode loadCityData:
async loadCityData(cityName) {
  try {
    // Vérifier dans le storage en premier
    const cachedData = mosqueTimesStorageService.getCityData(cityName);
    
    if (cachedData) {
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