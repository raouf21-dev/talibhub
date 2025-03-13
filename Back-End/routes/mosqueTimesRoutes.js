const express = require("express");
const router = express.Router();
const mosqueTimesController = require("../controllers/mosqueTimesController");
const { attachCookieManager } = require("../middlewares/cookieManager");

// Middleware pour ce routeur
router.use(attachCookieManager);

// Routes publiques
router.get("/exists/:date", mosqueTimesController.checkDataExists);
router.get("/cities/search", mosqueTimesController.searchCities);
router.get("/cities/:city/mosques", mosqueTimesController.getMosquesByCity);
router.post(
  "/report-missing-data/:date",
  mosqueTimesController.reportMissingData
);

// Routes protégées (l'authentification est gérée par le middleware global)
router.post("/scrape", mosqueTimesController.manualScrape);
router.post("/scrape-all", mosqueTimesController.scrapeAllCities);
router.post("/scrape/:city", mosqueTimesController.scrapeByCity);
router.get("/all", mosqueTimesController.getAllMosques);
router.get("/search", mosqueTimesController.searchMosques);
router.post("/add", mosqueTimesController.addMosque);
router.post("/user/selected-city", mosqueTimesController.setSelectedCity);
router.get("/user/selected-city", mosqueTimesController.getSelectedCity);

module.exports = router;
