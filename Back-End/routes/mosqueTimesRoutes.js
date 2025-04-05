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

router.get("/scraping-status/:requestId", mosqueTimesController.checkScrapingStatus);

// Routes protégées (avec authentification)
const protectedRoutes = [
  {
    method: "post",
    path: "/scrape",
    handler: mosqueTimesController.manualScrape,
  },
  {
    method: "post",
    path: "/scrape-all",
    handler: mosqueTimesController.scrapeAllCities,
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
