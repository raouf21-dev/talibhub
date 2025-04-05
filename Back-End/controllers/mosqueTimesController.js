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
      // Si c'est une requête HTTP avec réponse différée
      let isHttpRequest = req && res;
      let responseAlreadySent = false;

      // Si c'est une requête HTTP, envoyer immédiatement une réponse pour ne pas bloquer le client
      if (isHttpRequest) {
        res.json({
          message: "Scraping démarré avec succès",
          status: "processing",
          requestId: Date.now().toString(), // Identifiant unique pour cette requête
        });
        responseAlreadySent = true;
      }

      // Stocker les résultats pour les rendre disponibles aux clients
      const scrapingResults = {
        cities: {},
        completedAt: null,
        status: "processing",
      };

      // Ajouter cette requête à la liste des scrapings en cours
      global.activeScrapings = global.activeScrapings || {};
      const requestId = Date.now().toString();
      global.activeScrapings[requestId] = scrapingResults;

      // Exécuter le scraping
      const cities = await mosqueTimesModel.getAllCities();
      for (const city of cities) {
        const mosques = await mosqueTimesModel.getMosquesByCity(city);
        const data = await this.scrapingService.scrapeCity(city, mosques);

        // Collecter les données pour chaque ville au fur et à mesure
        for (const item of data) {
          await mosqueTimesModel.savePrayerTimes(
            item.mosqueId,
            item.date,
            item.times
          );
        }

        // Récupérer les données à jour pour cette ville
        const date = new Date().toISOString().split("T")[0];
        const prayerTimesData = await this.getPrayerTimesForCityAndDateInternal(
          city,
          date
        );

        // Stocker les résultats pour cette ville
        scrapingResults.cities[city] = {
          mosques,
          prayerTimesData,
        };

        // Mettre à jour le statut global
        scrapingResults.lastUpdatedCity = city;
      }

      // Marquer le scraping comme terminé
      scrapingResults.completedAt = new Date().toISOString();
      scrapingResults.status = "completed";

      console.log("Scraping en arrière-plan terminé avec succès");

      // La réponse a déjà été envoyée (processing),
      // les données seront récupérées via l'endpoint de vérification
      return scrapingResults;
    } catch (error) {
      console.error("Erreur lors du scraping pour toutes les villes :", error);

      // Mettre à jour le statut global
      if (global.activeScrapings && global.activeScrapings[requestId]) {
        global.activeScrapings[requestId].status = "failed";
        global.activeScrapings[requestId].error = error.message;
      }

      if (req && res && !responseAlreadySent) {
        res
          .status(500)
          .json({ message: "Erreur lors du scraping", error: error.message });
      }
      return false;
    }
  }

  // Méthode interne pour récupérer les horaires par ville et date (sans réponse HTTP)
  async getPrayerTimesForCityAndDateInternal(city, date) {
    try {
      const mosques = await mosqueTimesModel.getMosquesByCity(city);

      if (mosques.length === 0) {
        return { message: "Aucune mosquée trouvée dans cette ville." };
      }

      const prayerTimesPromises = mosques.map((mosque) =>
        mosqueTimesModel.getPrayerTimes(mosque.id, date)
      );

      const prayerTimesResults = await Promise.all(prayerTimesPromises);
      const formattedPrayerTimes = prayerTimesResults
        .filter((times) => times !== null && times !== undefined)
        .map((times, index) => {
          // Formater les horaires et créer un objet complet avec l'ID de la mosquée
          const formattedTimes = { ...times };
          Object.keys(formattedTimes).forEach((key) => {
            if (formattedTimes[key] instanceof Date) {
              formattedTimes[key] = formattedTimes[key]
                .toTimeString()
                .slice(0, 5);
            }
          });
          return {
            mosque_id: mosques[index].id,
            ...formattedTimes,
          };
        });

      return {
        cityName: city,
        date: date,
        prayerTimes: formattedPrayerTimes,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des horaires de prière :",
        error
      );
      throw error;
    }
  }

  // Nouvel endpoint pour vérifier le statut d'un scraping
  async checkScrapingStatus(req, res) {
    const { requestId } = req.params;
    console.log(
      `[DEBUG] Vérification du statut de scraping pour requestId: ${requestId}`
    );

    // Initialiser global.activeScrapings s'il n'existe pas encore
    if (!global.activeScrapings) {
      global.activeScrapings = {};
      console.log(`[DEBUG] Initialisation de global.activeScrapings`);
    }

    // Si aucun scraping n'est trouvé pour cet ID
    if (!global.activeScrapings[requestId]) {
      console.log(`[DEBUG] Aucun scraping trouvé pour requestId: ${requestId}`);

      // Vérifier si des scrapings sont en cours
      const activeScrapings = Object.keys(global.activeScrapings);
      if (activeScrapings.length > 0) {
        // Prendre le scraping actif le plus récent
        const latestRequestId = activeScrapings[activeScrapings.length - 1];
        console.log(
          `[DEBUG] Redirection vers le scraping actif le plus récent: ${latestRequestId}`
        );

        // Rediriger la requête vers le scraping le plus récent
        return res.json({
          ...global.activeScrapings[latestRequestId],
          requestId: latestRequestId,
          redirected: true,
          originalRequestId: requestId,
        });
      }

      // Si aucun scraping n'est en cours, retourner une erreur
      return res.status(404).json({
        message: "Aucun scraping en cours",
        status: "not_found",
        error: "Scraping non trouvé",
      });
    }

    const scrapingResult = global.activeScrapings[requestId];
    console.log(
      `[DEBUG] Statut actuel du scraping ${requestId}: ${scrapingResult.status}`
    );

    // Si le scraping est terminé, supprimer la référence après un certain temps
    if (
      scrapingResult.status === "completed" ||
      scrapingResult.status === "failed"
    ) {
      console.log(
        `[DEBUG] Scraping ${requestId} terminé (${scrapingResult.status}), programmation du nettoyage`
      );

      // Programmer la suppression après 5 minutes
      setTimeout(() => {
        if (global.activeScrapings && global.activeScrapings[requestId]) {
          console.log(`[DEBUG] Nettoyage du scraping terminé ${requestId}`);
          delete global.activeScrapings[requestId];
        }
      }, 5 * 60 * 1000);
    }

    return res.json(scrapingResult);
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
      console.log(
        `[DEBUG] getPrayerTimesForCityAndDate: Requête pour ville=${city}, date=${date}`
      );

      const mosques = await mosqueTimesModel.getMosquesByCity(city);

      if (mosques.length === 0) {
        console.log(
          `[DEBUG] getPrayerTimesForCityAndDate: Aucune mosquée trouvée pour la ville ${city}`
        );
        return res
          .status(404)
          .json({ message: "Aucune mosquée trouvée dans cette ville." });
      }

      console.log(
        `[DEBUG] getPrayerTimesForCityAndDate: ${mosques.length} mosquées trouvées pour ${city}`
      );

      const prayerTimesPromises = mosques.map((mosque) =>
        mosqueTimesModel.getPrayerTimes(mosque.id, date)
      );

      const prayerTimesResults = await Promise.all(prayerTimesPromises);
      console.log(
        `[DEBUG] getPrayerTimesForCityAndDate: Résultats récupérés=${
          prayerTimesResults.filter((r) => r !== null).length
        }/${prayerTimesResults.length}`
      );

      const formattedPrayerTimes = prayerTimesResults
        .filter((times) => times !== null && times !== undefined)
        .map((times) => {
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
        .filter((times) => times !== null);

      console.log(
        `[DEBUG] getPrayerTimesForCityAndDate: Horaires formatés pour réponse=${formattedPrayerTimes.length} mosquées`
      );

      // Si aucun horaire n'est trouvé, déclencher un scraping (peut être en arrière-plan)
      if (formattedPrayerTimes.length === 0) {
        console.log(
          `[DEBUG] getPrayerTimesForCityAndDate: Aucun horaire trouvé, déclenchement du scraping en arrière-plan`
        );
        // Lancer un scraping en arrière-plan pour cette ville
        setImmediate(async () => {
          try {
            const mosques = await mosqueTimesModel.getMosquesByCity(city);
            console.log(
              `[DEBUG] Scraping en arrière-plan pour ${city}, ${mosques.length} mosquées`
            );
            const scrapeService = new ScrapingService();
            const data = await scrapeService.scrapeCity(city, mosques);
            console.log(
              `[DEBUG] Résultats du scraping: ${data.length} mosquées scrapées`
            );
            for (const item of data) {
              console.log(
                `[DEBUG] Sauvegarde des données pour mosquée ${item.mosqueId}`
              );
              await mosqueTimesModel.savePrayerTimes(
                item.mosqueId,
                item.date,
                item.times
              );
            }
            console.log(
              `[DEBUG] Scraping en arrière-plan terminé pour ${city}`
            );
          } catch (error) {
            console.error(
              `[DEBUG] Erreur lors du scraping en arrière-plan:`,
              error
            );
          }
        });
      }

      return res.json({
        prayerTimes: formattedPrayerTimes,
        message:
          formattedPrayerTimes.length === 0
            ? "Aucun horaire trouvé pour cette date"
            : undefined,
      });
    } catch (error) {
      console.error(`[DEBUG] getPrayerTimesForCityAndDate: Erreur:`, error);
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

  async reportMissingData(req, res) {
    try {
      const { date } = req.params;
      const { source } = req.body;

      console.log(
        `Données manquantes signalées pour la date ${date} depuis ${source}`
      );

      // Répondre immédiatement au client
      res.status(200).json({
        success: true,
        message: "Merci de nous avoir signalé des données manquantes",
      });

      // Lancer le scraping en arrière-plan sans bloquer la réponse
      if (source === "welcome-page") {
        console.log(
          "Déclenchement du scraping en arrière-plan suite à un signalement"
        );

        // Utiliser la méthode scrapeAllCities sans les paramètres req/res
        (async () => {
          try {
            console.log("Début du scraping pour toutes les villes");
            await this.scrapeAllCities.bind(this)();
            console.log("Scraping en arrière-plan terminé avec succès");
          } catch (backgroundError) {
            console.error(
              "Erreur lors du scraping en arrière-plan:",
              backgroundError
            );
          }
        })();
      }
    } catch (error) {
      console.error("Erreur lors du signalement de données manquantes:", error);
      return res.status(500).json({
        success: false,
        message: "Une erreur est survenue lors du traitement de votre demande",
      });
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
  reportMissingData: controller.reportMissingData.bind(controller),
  checkScrapingStatus: controller.checkScrapingStatus.bind(controller),
};
