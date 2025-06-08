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

router.get(
  "/scraping-status/:requestId",
  mosqueTimesController.checkScrapingStatus
);
router.get(
  "/completion-status/:date",
  mosqueTimesController.checkCompletionStatus
);
// Nouvelle route pour vérifier le statut du scraping en temps réel
router.get(
  "/scraping-status-realtime/:date",
  mosqueTimesController.getScrapingStatus
);

// ✅ NOUVEAU: Route pour Long Polling - attendre la fin du scraping
router.get(
  "/wait-scraping-completion/:date",
  mosqueTimesController.waitForScrapingCompletion
);

// Route publique pour déclencher le scraping automatique
router.post("/scrape-all", mosqueTimesController.scrapeAllCities);

// ✨ Route ultra-simple : scraper tout et attendre la fin complète
router.get("/scrape-all-and-wait", mosqueTimesController.scrapeAllAndWait);

// Routes protégées (avec authentification)
const protectedRoutes = [
  {
    method: "post",
    path: "/scrape",
    handler: mosqueTimesController.manualScrape,
  },
  {
    method: "post",
    path: "/scrape/:city",
    handler: mosqueTimesController.scrapeByCity,
  },
  { method: "get", path: "/all", handler: mosqueTimesController.getAllMosques },
  {
    method: "get",
    path: "/search",
    handler: mosqueTimesController.searchMosques,
  },
  { method: "post", path: "/add", handler: mosqueTimesController.addMosque },
  {
    method: "post",
    path: "/user/selected-city",
    handler: mosqueTimesController.setSelectedCity,
  },
  {
    method: "get",
    path: "/user/selected-city",
    handler: mosqueTimesController.getSelectedCity,
  },
];

// Enregistrer les routes protégées
protectedRoutes.forEach((route) => {
  router[route.method](route.path, authenticateToken, route.handler);
});

module.exports = router;
