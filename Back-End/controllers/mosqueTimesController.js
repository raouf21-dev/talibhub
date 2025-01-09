// mosqueTimesController.js
const axios = require("axios");
const cheerio = require("cheerio");
const { scrapers } = require("../scrapers/indexScrapers.js");
const mosqueTimesModel = require("../models/mosqueTimesModel");

class ScrapingService {
  async scrapeMosque(mosqueId) {
    if (!scrapers[mosqueId]) {
      console.error(`No scraper found for mosque ID ${mosqueId}`);
      return null;
    }

    try {
      const data = await scrapers[mosqueId]();
      if (data && data.times) {
        return {
          date: data.dateText || new Date().toISOString().split("T")[0],
          times: {
            fajr: data.times.fajr || null,
            dhuhr: data.times.dhuhr || null,
            asr: data.times.asr || null,
            maghrib: data.times.maghrib || null,
            isha: data.times.isha || null,
            jumuah1: data.times.jumuah1 || null,
            jumuah2: data.times.jumuah2 || null,
            jumuah3: data.times.jumuah3 || null,
            tarawih: data.times.tarawih || null,
          },
        };
      }
      return null;
    } catch (error) {
      console.error(`Error scraping mosque ID ${mosqueId}:`, error);
      return null;
    }
  }

  async scrapeCity(city, mosques) {
    const results = [];
    for (const mosque of mosques) {
      const data = await this.scrapeMosque(mosque.id);
      if (data) {
        results.push({ mosqueId: mosque.id, ...data });
      }
    }
    return results;
  }
}

class MosqueTimesController {
  constructor() {
    this.scrapingService = new ScrapingService();
  }

  async manualScrape(req, res) {
    try {
      console.log("Starting manual scrape...");
      const mosques = await mosqueTimesModel.getAllMosques();
      for (const mosque of mosques) {
        const data = await this.scrapingService.scrapeMosque(mosque.id);
        if (data) {
          await mosqueTimesModel.savePrayerTimes(
            mosque.id,
            data.date,
            data.times
          );
        }
      }
      res.json({ message: "Scraping completed successfully" });
    } catch (error) {
      console.error("Error during manual scraping:", error);
      res.status(500).json({
        message: "Error during scraping",
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async scrapeAllCities(req, res) {
    try {
      const cities = await mosqueTimesModel.getAllCities();
      for (const city of cities) {
        const mosques = await mosqueTimesModel.getMosquesByCity(city);
        const data = await this.scrapingService.scrapeCity(city, mosques);
        for (const item of data) {
          await mosqueTimesModel.savePrayerTimes(
            item.mosqueId,
            item.date,
            item.times
          );
        }
      }
      res.json({
        message: "Scraping terminé avec succès pour toutes les villes",
      });
    } catch (error) {
      console.error("Erreur lors du scraping pour toutes les villes :", error);
      res
        .status(500)
        .json({ message: "Erreur lors du scraping", error: error.message });
    }
  }

  async scrapeByCity(req, res) {
    try {
      const city = req.params.city;
      if (!city) {
        return res
          .status(400)
          .json({ message: "Le paramètre 'ville' est requis" });
      }
      const mosques = await mosqueTimesModel.getMosquesByCity(city);
      const data = await this.scrapingService.scrapeCity(city, mosques);
      for (const item of data) {
        await mosqueTimesModel.savePrayerTimes(
          item.mosqueId,
          item.date,
          item.times
        );
      }
      res.json({
        message: `Scraping terminé avec succès pour la ville ${city}`,
      });
    } catch (error) {
      console.error(`Erreur lors du scraping pour la ville:`, error);
      res.status(500).json({
        message: "Erreur lors du scraping",
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async getPrayerTimes(req, res) {
    try {
      const { mosqueId, date } = req.params;
      const times = await mosqueTimesModel.getPrayerTimes(mosqueId, date);
      if (times) {
        Object.keys(times).forEach((key) => {
          if (times[key] instanceof Date) {
            times[key] = times[key].toTimeString().slice(0, 5);
          }
        });
        res.json(times);
      } else {
        res.status(404).json({ message: "Prayer times not found" });
      }
    } catch (error) {
      console.error("Error getting prayer times:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getAllMosques(req, res) {
    try {
      const mosques = await mosqueTimesModel.getAllMosques();
      res.json(mosques);
    } catch (error) {
      console.error("Error fetching all mosques:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async searchCities(req, res) {
    try {
      const query = req.query.query || "";
      const cities = await mosqueTimesModel.searchCities(query);
      res.json(cities);
    } catch (error) {
      console.error("Erreur lors de la recherche des villes :", error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  }

  async getMosquesByCity(req, res) {
    try {
      const city = req.params.city;
      if (!city) {
        return res
          .status(400)
          .json({ message: "Le paramètre ville est requis." });
      }
      const mosques = await mosqueTimesModel.getMosquesByCity(city);
      res.json(mosques);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des mosquées par ville :",
        error
      );
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  }

  async searchMosques(req, res) {
    try {
      const { lat, lon } = req.query;
      if (!lat || !lon) {
        return res
          .status(400)
          .json({ message: "Latitude and longitude are required" });
      }
      const mosques = await mosqueTimesModel.searchMosques(
        parseFloat(lat),
        parseFloat(lon)
      );
      res.json(mosques);
    } catch (error) {
      console.error("Error searching mosques:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async addMosque(req, res) {
    try {
      const { name, address, latitude, longitude } = req.body;
      if (!name || !address || !latitude || !longitude) {
        return res.status(400).json({ message: "All fields are required" });
      }
      const mosqueId = await mosqueTimesModel.addMosque(
        name,
        address,
        parseFloat(latitude),
        parseFloat(longitude)
      );
      res.status(201).json({ message: "Mosque added successfully", mosqueId });
    } catch (error) {
      console.error("Error adding mosque:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async checkDataExists(req, res) {
    try {
      const date = req.params.date;
      const dataExists = await mosqueTimesModel.checkDataExists(date);
      res.json({ exists: dataExists });
    } catch (error) {
      console.error(
        "Erreur lors de la vérification des données existantes :",
        error
      );
      res.status(500).json({ message: "Erreur du serveur" });
    }
  }

  async getPrayerTimesForCityAndDate(req, res) {
    try {
      const { city, date } = req.params;
      const mosques = await mosqueTimesModel.getMosquesByCity(city);

      if (mosques.length === 0) {
        return res
          .status(404)
          .json({ message: "Aucune mosquée trouvée dans cette ville." });
      }

      const prayerTimesPromises = mosques.map((mosque) =>
        mosqueTimesModel.getPrayerTimes(mosque.id, date)
      );

      const prayerTimesResults = await Promise.all(prayerTimesPromises);
      const formattedPrayerTimes = prayerTimesResults
        .filter((times) => times !== null && times !== undefined) // Ajout de la vérification undefined
        .map((times) => {
          // Vérification supplémentaire pour s'assurer que times est valide
          if (!times || !times.mosque_id) {
            return null;
          }
          return {
            mosque_id: times.mosque_id,
            date: times.date,
            fajr: times.fajr || null,
            dhuhr: times.dhuhr || null,
            asr: times.asr || null,
            maghrib: times.maghrib || null,
            isha: times.isha || null,
            jumuah1: times.jumuah1 || null,
            jumuah2: times.jumuah2 || null,
            jumuah3: times.jumuah3 || null,
            tarawih: times.tarawih || null,
          };
        })
        .filter((times) => times !== null); // Filtrer les résultats nuls

      // Si aucun horaire n'est trouvé, renvoyer un tableau vide plutôt qu'une erreur
      return res.json({
        prayerTimes: formattedPrayerTimes,
        message:
          formattedPrayerTimes.length === 0
            ? "Aucun horaire trouvé pour cette date"
            : undefined,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des horaires de prière:",
        error
      );
      return res
        .status(500)
        .json({ message: "Erreur du serveur", error: error.message });
    }
  }

  async setSelectedCity(req, res) {
    try {
      const { city } = req.body;
      if (!city) {
        return res.status(400).json({ message: "La ville est requise" });
      }

      // Utiliser le cookieManager attaché par le middleware
      res.cookieManager.setSelectedCity(res, city);

      res.status(200).json({
        message: "Ville sauvegardée avec succès",
        city: city,
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la ville:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }

  async getSelectedCity(req, res) {
    try {
      const city = res.cookieManager.getSelectedCity(req);
      res.status(200).json({ city });
    } catch (error) {
      console.error("Erreur lors de la récupération de la ville:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
}

// Créer une instance du contrôleur
const controller = new MosqueTimesController();

// Exporter les méthodes liées aux routes
module.exports = {
  manualScrape: controller.manualScrape.bind(controller),
  scrapeAllCities: controller.scrapeAllCities.bind(controller),
  scrapeByCity: controller.scrapeByCity.bind(controller),
  getPrayerTimes: controller.getPrayerTimes.bind(controller),
  getAllMosques: controller.getAllMosques.bind(controller),
  searchCities: controller.searchCities.bind(controller),
  getMosquesByCity: controller.getMosquesByCity.bind(controller),
  searchMosques: controller.searchMosques.bind(controller),
  addMosque: controller.addMosque.bind(controller),
  checkDataExists: controller.checkDataExists.bind(controller),
  getPrayerTimesForCityAndDate:
    controller.getPrayerTimesForCityAndDate.bind(controller),
  setSelectedCity: controller.setSelectedCity.bind(controller),
  getSelectedCity: controller.getSelectedCity.bind(controller),
};
