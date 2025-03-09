const express = require("express");
const { authenticateToken } = require("../middlewares/authenticateToken");
const { attachCookieManager } = require("../middlewares/cookieManager");
const router = express.Router();
const mosqueTimesController = require("../controllers/mosqueTimesController");

// Middlewares globaux pour ce routeur
router.use(attachCookieManager);

// Helper pour l'authentification
const auth = (handler) => [authenticateToken, handler];

// Routes publiques (sans authentification)
router.get("/exists/:date", mosqueTimesController.checkDataExists);
router.get("/cities/search", mosqueTimesController.searchCities);
router.get("/cities/:city/mosques", mosqueTimesController.getMosquesByCity);
router.get("/:mosqueId/:date", mosqueTimesController.getPrayerTimes);
// Ajout de la route des horaires en public
router.get(
  "/cities/:city/date/:date/prayer-times",
  mosqueTimesController.getPrayerTimesForCityAndDate
);

// Routes protégées (avec authentification)
router.post("/scrape", auth(mosqueTimesController.manualScrape));
router.post("/scrape-all", auth(mosqueTimesController.scrapeAllCities));
router.post("/scrape/:city", auth(mosqueTimesController.scrapeByCity));
router.get("/all", auth(mosqueTimesController.getAllMosques));
router.get("/search", auth(mosqueTimesController.searchMosques));
router.post("/add", auth(mosqueTimesController.addMosque));

// Routes pour les préférences utilisateur
router.post("/user/selected-city", auth(mosqueTimesController.setSelectedCity));
router.get("/user/selected-city", auth(mosqueTimesController.getSelectedCity));

// Routes pour les horaires de prière
router.get(
  "/cities/:city/date/:date/prayer-times",
  auth(mosqueTimesController.getPrayerTimesForCityAndDate)
);

// Ajouter cette route publique pour signaler des données manquantes
router.post(
  "/report-missing-data/:date",
  mosqueTimesController.reportMissingData
);

module.exports = router;
