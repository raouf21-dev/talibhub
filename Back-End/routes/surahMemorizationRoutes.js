// surahMemorizationRoutes.js
const express = require("express");
const router = express.Router();
const surahMemorizationController = require("../controllers/surahMemorizationControllers");
const { authenticateToken } = require('../middlewares/authenticateToken');

// Routes
router.get("/surahs", 
  authenticateToken, 
  surahMemorizationController.getSurahs
);

router.post(
  "/surahs/:number",
  authenticateToken,
  surahMemorizationController.updateSurah
);

router.put(
  "/surahs/:number/known",
  authenticateToken,
  surahMemorizationController.updateSurahKnownStatus
);

router.get(
  "/history",
  authenticateToken,
  surahMemorizationController.getHistory
);

router.delete(
  "/history",
  authenticateToken,
  surahMemorizationController.clearHistory
);

router.post(
  "/known",
  authenticateToken,
  surahMemorizationController.saveKnownSurahs
);

router.get(
  "/known",
  authenticateToken,
  surahMemorizationController.getKnownSurahs
);

module.exports = router;