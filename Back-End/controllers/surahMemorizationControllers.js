// surahMemorizationControllers.js
const {
  getSurahsByUser,
  getSurahsDueForRevision,
  updateSurahStatus,
  getRevisionHistory,
  clearRevisionHistory,
  markSurahsAvailableForRevision,
  getAvailableSurahsForRevision,
  // Compatibilité avec l'ancien système
  saveKnownSurahs,
  getKnownSurahs,
} = require("../models/surahMemorizationModel");

// Récupérer toutes les sourates avec leur statut de mémorisation
const getSurahs = async (req, res) => {
  const userId = req.user.id;
  try {
    const surahs = await getSurahsByUser(userId);
    res.json({ surahs });
  } catch (error) {
    console.error("Error fetching surahs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Récupérer les sourates dues pour révision (répétition espacée)
const getSurahsDueForRevisionController = async (req, res) => {
  const userId = req.user.id;
  try {
    const surahs = await getSurahsDueForRevision(userId);
    res.json({
      surahs,
      count: surahs.length,
      message:
        surahs.length === 0
          ? "Aucune sourate due pour révision"
          : `${surahs.length} sourate(s) due(s) pour révision`,
    });
  } catch (error) {
    console.error("Error fetching surahs due for revision:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mettre à jour le niveau de mémorisation d'une sourate
const updateSurah = async (req, res) => {
  const userId = req.user.id;
  const surahNumber = parseInt(req.params.number, 10);
  const { memorizationLevel, lastRevisionDate } = req.body;

  // Validation des données
  if (
    !memorizationLevel ||
    !["Strong", "Good", "Moderate", "Weak"].includes(memorizationLevel)
  ) {
    return res.status(400).json({ error: "Invalid memorization level" });
  }

  try {
    await updateSurahStatus(
      userId,
      surahNumber,
      memorizationLevel,
      lastRevisionDate || new Date().toISOString().split("T")[0]
    );
    res.json({
      message: "Surah updated successfully",
      surahNumber,
      memorizationLevel,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating surah:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Marquer les sourates comme disponibles pour révision
const markSurahsForRevision = async (req, res) => {
  const userId = req.user.id;
  const { sourates } = req.body;

  if (!Array.isArray(sourates)) {
    return res.status(400).json({ error: "Sourates must be an array" });
  }

  // Validation des numéros de sourates
  const validSurahs = sourates.filter(
    (num) => Number.isInteger(num) && num >= 1 && num <= 114
  );

  if (validSurahs.length !== sourates.length) {
    const invalidSurahs = sourates.filter(
      (num) => !Number.isInteger(num) || num < 1 || num > 114
    );
    console.log("❌ Sourates invalides:", invalidSurahs);
    return res.status(400).json({ error: "Invalid surah numbers provided" });
  }

  try {
    await markSurahsAvailableForRevision(userId, validSurahs);
    res.json({
      message: "Surahs marked for revision successfully",
      count: validSurahs.length,
      surahs: validSurahs,
    });
  } catch (error) {
    console.error("Error marking surahs for revision:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Récupérer les sourates disponibles pour révision
const getAvailableSurahs = async (req, res) => {
  const userId = req.user.id;
  try {
    const surahs = await getAvailableSurahsForRevision(userId);
    res.json({
      surahs,
      count: surahs.length,
    });
  } catch (error) {
    console.error("Error fetching available surahs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Récupérer l'historique de révision (seulement les sourates évaluées)
const getHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const history = await getRevisionHistory(userId);
    res.json({
      history,
      count: history.length,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Effacer l'historique de révision (remet les niveaux à NULL)
const clearHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    await clearRevisionHistory(userId);
    res.json({
      message: "Revision history cleared successfully",
      clearedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error clearing history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// === CONTRÔLEURS DE COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME ===

// Mettre à jour le statut "connu" d'une sourate (DÉPRÉCIÉ - pour compatibilité)
const updateSurahKnownStatus = async (req, res) => {
  const userId = req.user.id;
  const surahNumber = parseInt(req.params.number, 10);
  const { isKnown } = req.body;

  try {
    if (isKnown) {
      await markSurahsAvailableForRevision(userId, [surahNumber]);
    } else {
      await markSurahsAvailableForRevision(userId, []);
    }
    res.json({
      message: "Surah availability status updated successfully",
      deprecated: "This endpoint is deprecated. Use POST /known instead.",
    });
  } catch (error) {
    console.error("Error updating surah known status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Sauvegarder les sourates connues (pour compatibilité avec surahSelector.js)
const saveKnownSurahsController = async (req, res) => {
  const userId = req.user.id;
  const { sourates } = req.body;

  if (!Array.isArray(sourates)) {
    return res.status(400).json({ error: "Sourates must be an array" });
  }

  try {
    await saveKnownSurahs(userId, sourates);
    res.json({
      message: "Known surahs saved successfully",
      count: sourates.length,
    });
  } catch (error) {
    console.error("Error saving known surahs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Récupérer les sourates connues (pour compatibilité avec surahSelector.js)
const getKnownSurahsController = async (req, res) => {
  const userId = req.user.id;
  try {
    const knownSurahs = await getKnownSurahs(userId);
    res.json({
      knownSurahs,
      count: knownSurahs.length,
    });
  } catch (error) {
    console.error("Error fetching known surahs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Export des fonctions du contrôleur
module.exports = {
  // Nouvelles fonctions principales
  getSurahs,
  getSurahsDueForRevision: getSurahsDueForRevisionController,
  updateSurah,
  markSurahsForRevision,
  getAvailableSurahs,
  getHistory,
  clearHistory,

  // Fonctions de compatibilité
  updateSurahKnownStatus,
  saveKnownSurahs: saveKnownSurahsController,
  getKnownSurahs: getKnownSurahsController,
};
