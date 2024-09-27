// mosqueTimesController.js

const axios = require("axios");
const cheerio = require("cheerio");
const { scrapers } = require("../scrapers/indexscrapers.js");
const mosqueTimesModel = require("../models/mosqueTimesModel");

const scrapePrayerTimes = async () => {
  try {
    for (const [mosqueId, scraper] of Object.entries(scrapers)) {
      console.log(`Scraping mosque ID ${mosqueId}`);
      if (!scraper) {
        console.error(`No scraper found for mosque ID ${mosqueId}`);
        continue; // Passer à la mosquée suivante si aucun scraper n'est trouvé
      }
      try {
        const data = await scraper();
        if (data && data.times) {
          const date = data.dateText || new Date().toISOString().split('T')[0]; // Utiliser la date extraite ou la date actuelle
          await mosqueTimesModel.savePrayerTimes(mosqueId, date, data.times);
          console.log(`Prayer times for mosque ID ${mosqueId} saved successfully`);
        } else {
          console.warn(`No times found for mosque ID ${mosqueId}`);
        }
      } catch (error) {
        console.error(`Error scraping mosque ID ${mosqueId}:`, error);
      }
    }
    console.log('Scraping completed successfully for all mosques');
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  }
};

const manualScrape = async (req, res) => {
  try {
    console.log("Starting manual scrape...");
    await scrapePrayerTimes();
    console.log("Manual scrape completed successfully");
    res.json({ message: "Scraping completed successfully" });
  } catch (error) {
    console.error("Error during manual scraping:", error);
    res.status(500).json({
      message: "Error during scraping",
      error: error.message,
      stack: error.stack,
    });
  }
};

const getPrayerTimes = async (req, res) => {
  try {
    const { mosqueId, date } = req.params;
    const times = await mosqueTimesModel.getPrayerTimes(mosqueId, date);
    if (times) {
      // Formatez les heures en chaînes de caractères HH:MM
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
};

const getAllMosques = async (req, res) => {
  try {
    const mosques = await mosqueTimesModel.getAllMosques();
    res.json(mosques);
  } catch (error) {
    console.error("Error fetching all mosques:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const searchMosques = async (req, res) => {
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
};

const addMosque = async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    // Validate input data
    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const mosqueId = await mosqueTimesModel.addMosque(
      name,
      address,
      parseFloat(latitude),
      parseFloat(longitude)
    );
    res.status(201).json({ message: 'Mosque added successfully', mosqueId });
  } catch (error) {
    console.error('Error adding mosque:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Fonction pour rechercher des villes
const searchCities = async (req, res) => {
  try {
    const query = req.query.query || '';
    // Si vous souhaitez récupérer toutes les villes sans filtre, commentez la condition suivante
    /*
    if (query.length < 1) {
      return res.status(400).json({ message: "Le paramètre de recherche doit comporter au moins 1 caractère." });
    }
    */
    const cities = await mosqueTimesModel.searchCities(query);
    res.json(cities);
  } catch (error) {
    console.error("Erreur lors de la recherche des villes :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


// Fonction pour récupérer les mosquées par ville
const getMosquesByCity = async (req, res) => {
  try {
    const city = req.params.city;
    if (!city) {
      return res.status(400).json({ message: "Le paramètre ville est requis." });
    }

    const mosques = await mosqueTimesModel.getMosquesByCity(city);
    res.json(mosques);
  } catch (error) {
    console.error("Erreur lors de la récupération des mosquées par ville :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

module.exports = {
  scrapePrayerTimes,
  manualScrape,
  getPrayerTimes,
  getAllMosques,
  searchMosques,
  addMosque,
  searchCities,
  getMosquesByCity,
};
