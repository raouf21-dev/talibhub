const express = require("express");
const router = express.Router();
const mosqueTimesController = require("../controllers/mosqueTimesController");
const { authenticateToken } = require("../middlewares/authenticateToken");
const { attachCookieManager } = require("../middlewares/cookieManager");

// Middlewares globaux pour ce routeur
router.use(attachCookieManager);

// Routes publiques (pas besoin d'auth ici car géré dans app.js)
router.get("/exists/:date", mosqueTimesController.checkDataExists);
router.get("/cities/search", mosqueTimesController.searchCities);
router.get("/cities/:city/mosques", mosqueTimesController.getMosquesByCity);

// Routes protégées
router.post("/scrape", authenticateToken, mosqueTimesController.manualScrape);
router.post("/scrape-all", authenticateToken, mosqueTimesController.scrapeAllCities);
router.post("/scrape/:city", authenticateToken, mosqueTimesController.scrapeByCity);
router.get("/all", authenticateToken, mosqueTimesController.getAllMosques);
router.get("/search", authenticateToken, mosqueTimesController.searchMosques);
router.post("/add", authenticateToken, mosqueTimesController.addMosque);

// Routes pour les préférences utilisateur
router.post("/user/selected-city", authenticateToken, mosqueTimesController.setSelectedCity);
router.get("/user/selected-city", authenticateToken, mosqueTimesController.getSelectedCity);

// Routes pour les horaires de prière
router.get(
  "/cities/:city/date/:date/prayer-times",
  authenticateToken,
  mosqueTimesController.getPrayerTimesForCityAndDate
);

// Ajouter cette route publique pour signaler des données manquantes
router.post(
  "/report-missing-data/:date",
  authenticateToken,
  mosqueTimesController.reportMissingData
);

module.exports = router;
