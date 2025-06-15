// statisticsRoutes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authenticateToken");
const statisticsController = require("../controllers/statisticsController");

// Routes pour les statistiques par période
router.get(
  "/daily",
  authenticateToken,
  statisticsController.getDailyStatistics
);
router.get(
  "/weekly",
  authenticateToken,
  statisticsController.getWeeklyStatistics
);
router.get(
  "/monthly",
  authenticateToken,
  statisticsController.getMonthlyStatistics
);
router.get(
  "/yearly",
  authenticateToken,
  statisticsController.getYearlyStatistics
);

// Route pour supprimer tout l'historique de l'utilisateur
router.delete(
  "/delete-all",
  authenticateToken,
  statisticsController.deleteAllUserHistory
);

module.exports = router;
