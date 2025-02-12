const express = require("express");
const { authenticateToken } = require('../middlewares/authenticateToken');
const { attachCookieManager } = require('../middlewares/cookieManager');
const router = express.Router();

// Attache le middleware cookieManager pour toutes les routes de ce routeur
router.use(attachCookieManager);

// Créer une fonction helper pour wrapper les routes avec authenticateToken
const auth = (handler) => [authenticateToken, handler];

// Routes spécifiques - Scraping
router.post("/scrape", auth(require("../controllers/mosqueTimesController").manualScrape));
router.post("/scrape-all", auth(require("../controllers/mosqueTimesController").scrapeAllCities));
router.post("/scrape/:city", auth(require("../controllers/mosqueTimesController").scrapeByCity));

// Routes de recherche et listage
router.get("/all", auth(require("../controllers/mosqueTimesController").getAllMosques));
router.get("/cities/search", auth(require("../controllers/mosqueTimesController").searchCities));
router.get("/cities/:city/mosques", auth(require("../controllers/mosqueTimesController").getMosquesByCity));
router.get("/search", auth(require("../controllers/mosqueTimesController").searchMosques));
router.post("/add", auth(require("../controllers/mosqueTimesController").addMosque));
router.get("/exists/:date", auth(require("../controllers/mosqueTimesController").checkDataExists));

// Routes pour les préférences utilisateur
router.post("/user/selected-city", auth(require("../controllers/mosqueTimesController").setSelectedCity));
router.get("/user/selected-city", auth(require("../controllers/mosqueTimesController").getSelectedCity));

// Route pour les horaires de prière par ville et date
router.get(
  "/cities/:city/date/:date/prayer-times",
  auth(require("../controllers/mosqueTimesController").getPrayerTimesForCityAndDate)
);

// Route générique pour les horaires de prière
router.get("/:mosqueId/:date", auth(require("../controllers/mosqueTimesController").getPrayerTimes));

module.exports = router;
