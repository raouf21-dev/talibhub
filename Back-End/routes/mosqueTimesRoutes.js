// mosqueTimesRoutes.js

const authenticateToken = require("../middlewares/authenticateToken");
const express = require("express");
const mosqueTimesController = require("../controllers/mosqueTimesController");
const router = express.Router();

// Routes spécifiques en premier
router.post("/scrape", authenticateToken, mosqueTimesController.manualScrape);
router.post(
  "/scrape-all",
  authenticateToken,
  mosqueTimesController.scrapeAllCities
);
router.post(
  "/scrape/:city",
  authenticateToken,
  mosqueTimesController.scrapeByCity
);

router.get("/all", authenticateToken, mosqueTimesController.getAllMosques);
router.get(
  "/cities/search",
  authenticateToken,
  mosqueTimesController.searchCities
);
router.get(
  "/cities/:city/mosques",
  authenticateToken,
  mosqueTimesController.getMosquesByCity
);
router.get("/search", authenticateToken, mosqueTimesController.searchMosques);
router.post("/add", authenticateToken, mosqueTimesController.addMosque);
router.get(
  "/exists/:date",
  authenticateToken,
  mosqueTimesController.checkDataExists
);

// Nouvelle route pour récupérer les horaires de prière d'une ville et d'une date spécifique
router.get(
  "/cities/:city/date/:date/prayer-times",
  authenticateToken,
  mosqueTimesController.getPrayerTimesForCityAndDate
);

// Routes générales en dernier
router.get(
  "/:mosqueId/:date",
  authenticateToken,
  mosqueTimesController.getPrayerTimes
);

module.exports = router;
