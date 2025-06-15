// surahMemorizationRoutes.js
const express = require("express");
const router = express.Router();
const surahMemorizationController = require("../controllers/surahMemorizationControllers");

const { authenticateToken } = require("../middlewares/authenticateToken");

// === ROUTES PRINCIPALES DU SYSTÈME DE MÉMORISATION ===

// Récupérer toutes les sourates avec leur statut de mémorisation
router.get("/surahs", authenticateToken, surahMemorizationController.getSurahs);

// Récupérer les sourates dues pour révision (répétition espacée)
router.get(
  "/surahs/due",
  authenticateToken,
  surahMemorizationController.getSurahsDueForRevision
);

// Récupérer les sourates disponibles pour révision
router.get(
  "/surahs/available",
  authenticateToken,
  surahMemorizationController.getAvailableSurahs
);

// Marquer les sourates comme disponibles pour révision (AVANT la route avec paramètre)
router.post(
  "/surahs/mark-for-revision",
  authenticateToken,
  surahMemorizationController.markSurahsForRevision
);

// Mettre à jour le niveau de mémorisation d'une sourate (APRÈS les routes spécifiques)
router.post(
  "/surahs/:number",
  authenticateToken,
  surahMemorizationController.updateSurah
);

// Récupérer l'historique de révision
router.get(
  "/history",
  authenticateToken,
  surahMemorizationController.getHistory
);

// Effacer l'historique de révision
router.delete(
  "/history",
  authenticateToken,
  surahMemorizationController.clearHistory
);

// === ROUTES DE COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME ===

// Mettre à jour le statut "connu" d'une sourate (DÉPRÉCIÉ)
router.put(
  "/surahs/:number/known",
  authenticateToken,
  surahMemorizationController.updateSurahKnownStatus
);

// Sauvegarder les sourates connues (compatibilité avec surahSelector.js)
router.post(
  "/known",
  authenticateToken,
  surahMemorizationController.saveKnownSurahs
);

// Récupérer les sourates connues (compatibilité avec surahSelector.js)
router.get(
  "/known",
  authenticateToken,
  surahMemorizationController.getKnownSurahs
);

module.exports = router;
