// surahMemorizationControllers.js
const {
  getSurahsByUser,
  updateSurahStatus,
  getRevisionHistory,
  clearRevisionHistory,
  saveKnownSurahs,
  getKnownSurahs,
} = require("../models/surahMemorizationModel");

// Récupérer toutes les sourates
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

// Mettre à jour le niveau de mémorisation d'une sourate
const updateSurah = async (req, res) => {
  const userId = req.user.id;
  const surahNumber = parseInt(req.params.number, 10);
  const { memorizationLevel, lastRevisionDate } = req.body;

  try {
    await updateSurahStatus(
      userId,
      surahNumber,
      memorizationLevel,
      lastRevisionDate
    );
    res.json({ message: "Surah updated successfully" });
  } catch (error) {
    console.error("Error updating surah:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mettre à jour le statut "connu" d'une sourate
const updateSurahKnownStatus = async (req, res) => {
  const userId = req.user.id;
  const surahNumber = parseInt(req.params.number, 10);
  const { isKnown } = req.body;

  try {
    if (isKnown) {
      await saveKnownSurahs(userId, [surahNumber]);
    } else {
      await saveKnownSurahs(userId, []);
    }
    res.json({ message: "Surah known status updated successfully" });
  } catch (error) {
    console.error("Error updating surah known status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Récupérer l'historique de révision
const getHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const history = await getRevisionHistory(userId);
    res.json({ history });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Effacer l'historique de révision
const clearHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    await clearRevisionHistory(userId);
    res.json({ message: "Revision history cleared successfully" });
  } catch (error) {
    console.error("Error clearing history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Sauvegarder les sourates connues
const saveKnownSurahsController = async (req, res) => {
  const userId = req.user.id;
  const { sourates } = req.body; // Un tableau de numéros de sourates

  try {
    await saveKnownSurahs(userId, sourates);
    res.json({ message: "Known surahs saved successfully" });
  } catch (error) {
    console.error("Error saving known surahs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Récupérer les sourates connues
const getKnownSurahsController = async (req, res) => {
  const userId = req.user.id;
  try {
    const knownSurahs = await getKnownSurahs(userId);
    res.json({ knownSurahs });
  } catch (error) {
    console.error("Error fetching known surahs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Export des fonctions du contrôleur
module.exports = {
  getSurahs,
  updateSurah,
  updateSurahKnownStatus,
  getHistory,
  clearHistory,
  saveKnownSurahs: saveKnownSurahsController,
  getKnownSurahs: getKnownSurahsController,
};
