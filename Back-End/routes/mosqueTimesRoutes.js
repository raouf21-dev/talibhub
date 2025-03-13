const express = require("express");
const router = express.Router();
const mosqueTimesController = require("../controllers/mosqueTimesController");
const { authenticateToken } = require("../middlewares/authenticateToken");
const { attachCookieManager } = require("../middlewares/cookieManager");

// Middleware pour ce routeur
router.use(attachCookieManager);

// Routes publiques (sans authentification)
router.get("/exists/:date", mosqueTimesController.checkDataExists);
router.get("/cities/search", mosqueTimesController.searchCities);
router.get("/cities/:city/mosques", mosqueTimesController.getMosquesByCity);
router.get(
  "/cities/:city/date/:date/prayer-times",
  mosqueTimesController.getPrayerTimesForCityAndDate
);
router.post(
  "/report-missing-data/:date",
  mosqueTimesController.reportMissingData
);

// Routes protégées (avec authentification)
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
router.get("/search", authenticateToken, mosqueTimesController.searchMosques);
router.post("/add", authenticateToken, mosqueTimesController.addMosque);
router.post(
  "/user/selected-city",
  authenticateToken,
  mosqueTimesController.setSelectedCity
);
router.get(
  "/user/selected-city",
  authenticateToken,
  mosqueTimesController.getSelectedCity
);

module.exports = router;
