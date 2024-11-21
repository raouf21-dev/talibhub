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
          
          // Assurez-vous que toutes les clés existent et sont définies à null si manquantes
          const times = {
            fajr: data.times.fajr || null,
            dhuhr: data.times.dhuhr || null,
            asr: data.times.asr || null,
            maghrib: data.times.maghrib || null,
            isha: data.times.isha || null,
            jumuah1: data.times.jumuah1 || null,
            jumuah2: data.times.jumuah2 || null,
            jumuah3: data.times.jumuah3 || null,
            tarawih: data.times.tarawih || null,
          };

          await mosqueTimesModel.savePrayerTimes(mosqueId, date, times);
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

const scrapePrayerTimesForCity = async (city) => {
  try {
    // Récupérer la liste des mosquées dans la ville
    const mosques = await mosqueTimesModel.getMosquesByCity(city);

    for (const mosque of mosques) {
      const mosqueId = mosque.id;
      const scraper = scrapers[mosqueId];
      console.log(`Scraping mosque ID ${mosqueId}`);
      if (!scraper) {
        console.error(`Aucun scraper trouvé pour la mosquée ID ${mosqueId}`);
        continue;
      }
      try {
        const data = await scraper();
        if (data && data.times && Object.keys(data.times).length > 0) {
          const date = data.dateText || new Date().toISOString().split('T')[0];
          console.log(`Enregistrement des horaires pour la mosquée ID ${mosqueId} à la date ${date}`);
          await mosqueTimesModel.savePrayerTimes(mosqueId, date, data.times);
          console.log(`Horaires de prière pour la mosquée ID ${mosqueId} enregistrés avec succès`);
        } else {
          console.warn(`Aucun horaire trouvé pour la mosquée ID ${mosqueId}`);
        }
      } catch (error) {
        console.error(`Erreur lors du scraping de la mosquée ID ${mosqueId}:`, error);
      }
    }
    console.log(`Scraping terminé avec succès pour la ville ${city}`);
  } catch (error) {
    console.error(`Erreur lors du scraping pour la ville ${city}:`, error);
    throw error;
  }
};


const scrapeByCity = async (req, res) => {
  let city;
  try {
    city = req.params.city;
    if (!city) {
      return res.status(400).json({ message: "Le paramètre 'ville' est requis" });
    }
    console.log(`Début du scraping pour la ville ${city}...`);
    await scrapePrayerTimesForCity(city);
    console.log(`Scraping pour la ville ${city} terminé avec succès`);
    res.json({ message: `Scraping terminé avec succès pour la ville ${city}` });
  } catch (error) {
    console.error(`Erreur lors du scraping pour la ville ${city}:`, error);
    res.status(500).json({
      message: "Erreur lors du scraping",
      error: error.message,
      stack: error.stack,
    });
  }
};

const scrapePrayerTimesForAllCities = async () => {
  try {
    // Récupérer toutes les villes disponibles
    const cities = await mosqueTimesModel.getAllCities();

    for (const city of cities) {
      await scrapePrayerTimesForCity(city);
    }
    console.log('Scraping pour toutes les villes terminé avec succès');
  } catch (error) {
    console.error('Erreur lors du scraping pour toutes les villes :', error);
    throw error;
  }
};


const checkDataExists = async (req, res) => {
  try {
    const date = req.params.date;
    const dataExists = await mosqueTimesModel.checkDataExists(date);
    res.json({ exists: dataExists });
  } catch (error) {
    console.error('Erreur lors de la vérification des données existantes :', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

const scrapeAllCities = async (req, res) => {
  try {
    await scrapePrayerTimesForAllCities();
    res.json({ message: 'Scraping terminé avec succès pour toutes les villes' });
  } catch (error) {
    console.error('Erreur lors du scraping pour toutes les villes :', error);
    res.status(500).json({ message: 'Erreur lors du scraping', error: error.message });
  }
};

const getPrayerTimesByMosqueAndDate = async (req, res) => {
  try {
    const mosqueId = req.params.mosqueId;
    const date = req.params.date;

    const prayerTimes = await mosqueTimesModel.getPrayerTimesByMosqueAndDate(mosqueId, date);

    if (prayerTimes) {
      res.json(prayerTimes);
    } else {
      res.status(404).json({ message: "Horaires de prière non trouvés pour cette mosquée et cette date" });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires de prière:', error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};

const getPrayerTimesForCityAndDate = async (req, res) => {
  const { city, date } = req.params;

  try {
    // Récupérer toutes les mosquées de la ville
    const mosques = await mosqueTimesModel.getMosquesByCity(city);

    if (mosques.length === 0) {
      return res.status(404).json({ message: "Aucune mosquée trouvée dans cette ville." });
    }

    // Récupérer les horaires de prière pour chaque mosquée
    const prayerTimesPromises = mosques.map(mosque =>
      mosqueTimesModel.getPrayerTimes(mosque.id, date)
    );

    const prayerTimesResults = await Promise.all(prayerTimesPromises);

    // Formater les données avant de les envoyer
    const formattedPrayerTimes = prayerTimesResults.map(times => {
      if (!times) return null;
      
      // Créer un objet avec toutes les propriétés, même si nulles
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
        tarawih: times.tarawih || null
      };
    });

    console.log('Formatted prayer times:', formattedPrayerTimes);

    return res.json({ prayerTimes: formattedPrayerTimes.filter(pt => pt !== null) });

  } catch (error) {
    console.error(`Erreur lors de la récupération des horaires de prière pour la ville ${city} et la date ${date} :`, error);
    return res.status(500).json({ message: "Erreur du serveur", error: error.message });
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
  scrapeByCity,
  scrapePrayerTimesForCity,
  scrapePrayerTimesForAllCities,
  checkDataExists,
  scrapeAllCities,
  getPrayerTimesByMosqueAndDate,
  getPrayerTimesForCityAndDate,
};
