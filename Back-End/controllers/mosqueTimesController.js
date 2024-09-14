// Back-End/controllers/mosqueTimesController.js

const axios = require("axios");
const cheerio = require("cheerio");
const scrapers = require("../scrapers/indexscrapers.js"); // Assurez-vous que le chemin est correct
const mosqueTimesModel = require("../models/mosqueTimesModel");

const scrapePrayerTimes = async (mosqueId = 1) => {
  try {
    const scraper = scrapers[mosqueId];
    if (!scraper) {
      throw new Error(`No scraper found for mosque ID ${mosqueId}`);
    }
    const { date, times } = await scraper();
    await mosqueTimesModel.savePrayerTimes(mosqueId, date, times);
    return times;
  } catch (error) {
    console.error("Error scraping prayer times:", error);
    throw error;
  }
};

const manualScrape = async (req, res) => {
  try {
    console.log("Starting manual scrape...");
    const times = await scrapePrayerTimes();
    console.log("Manual scrape completed successfully");
    res.json({ message: "Scraping completed successfully", times });
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
    const mosqueId = await mosqueTimesModel.addMosque(
      name,
      address,
      latitude,
      longitude
    );
    res.status(201).json({ message: "Mosque added successfully", mosqueId });
  } catch (error) {
    console.error("Error adding mosque:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  scrapePrayerTimes,
  manualScrape,
  getPrayerTimes,
  getAllMosques,
  searchMosques,
  addMosque,
};
