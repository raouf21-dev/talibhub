const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authenticateToken");
const sourateController = require("../controllers/sourateController");

// Routes pour les sourates
router.get("/", authenticateToken, sourateController.getAllSourates);
router.get("/known", authenticateToken, sourateController.getKnownSourates);
router.post("/known", authenticateToken, sourateController.updateKnownSourates);
router.post(
  "/by-numbers",
  authenticateToken,
  sourateController.getSouratesByNumbers
);

// Routes pour les récitations
router.post(
  "/recitations",
  authenticateToken,
  sourateController.recordRecitation
);
router.get(
  "/recitations/stats",
  authenticateToken,
  sourateController.getRecitationStats
);

router.get(
  "/recitations/info",
  authenticateToken,
  sourateController.getRecitationInfo
);
router.get(
  "/recitations/not-recited",
  authenticateToken,
  sourateController.getNotRecitedSourates
);
router.post(
  "/recitations/new-cycle",
  authenticateToken,
  sourateController.startNewCycle
);

// Routes pour les niveaux de mémorisation
router.get(
  "/memorization-status",
  authenticateToken,
  sourateController.getMemorizationStatus
);
router.post(
  "/memorization-status/:number",
  authenticateToken,
  sourateController.updateMemorizationStatus
);

// Route pour l'historique de mémorisation
router.get(
  "/memorization-history",
  authenticateToken,
  sourateController.getMemorizationHistory
);

// Route pour effacer l'historique
router.delete(
  "/memorization-history",
  authenticateToken,
  sourateController.clearMemorizationHistory
);

module.exports = router;
