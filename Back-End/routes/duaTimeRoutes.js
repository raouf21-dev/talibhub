const express = require("express");
const router = express.Router();
const duaTimeController = require("../controllers/duaTimeController");
const { authenticateToken } = require('../middlewares/authenticateToken');

// Routes pour le calculateur de Dua Time
router.get(
   "/prayer-times/city/:city", 
   authenticateToken, 
   duaTimeController.getPrayerTimesByCity
);

router.get(
   "/prayer-times/coordinates", 
   authenticateToken, 
   duaTimeController.getPrayerTimesByCoordinates
);

router.get(
   "/calculation-methods", 
   authenticateToken, 
   duaTimeController.getPrayerCalculationMethods
);

router.post(
   "/calculate/last-third", 
   authenticateToken, 
   duaTimeController.calculateLastThird
);

module.exports = router;