// Service pour centraliser le stockage des horaires de mosquées
const mosqueTimesStorageService = {
  storageKey: "mosque_times_data",

  // Récupérer les données d'une ville
  getCityData(cityName) {
    try {
      const normalizedCity = cityName.toLowerCase().trim();
      const today = this.getCurrentDateString();
      const storedData = this.getAllData();

      if (
        storedData[normalizedCity] &&
        storedData[normalizedCity].date === today
      ) {
        console.log(`Données trouvées dans le stockage local pour ${cityName}`);
        return storedData[normalizedCity].data;
      }

      return null;
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
      return null;
    }
  },

  // Stocker les données d'une ville
  saveCityData(cityName, data) {
    try {
      const normalizedCity = cityName.toLowerCase().trim();
      const today = this.getCurrentDateString();

      // Récupérer les données existantes
      const allData = this.getAllData();

      // Mettre à jour les données pour cette ville
      allData[normalizedCity] = {
        date: today,
        data: data,
        timestamp: Date.now(),
      };

      // Sauvegarder
      localStorage.setItem(this.storageKey, JSON.stringify(allData));
      console.log(`Données stockées pour ${cityName}`);

      return true;
    } catch (error) {
      console.error("Erreur lors du stockage des données:", error);
      return false;
    }
  },

  // Récupérer toutes les données stockées
  getAllData() {
    try {
      const existingData = localStorage.getItem(this.storageKey);
      return existingData ? JSON.parse(existingData) : {};
    } catch (error) {
      console.error("Erreur lors de la lecture du localStorage:", error);
      return {};
    }
  },

  // Obtenir la date actuelle au format YYYY-MM-DD
  getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  // Ajouter cette méthode au service
  clearMosqueTimesCookies() {
    try {
      document.cookie =
        "mosque_times_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      console.log("Cookie mosque_times_data effacé");
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression du cookie:", error);
      return false;
    }
  },
};

export default mosqueTimesStorageService;
