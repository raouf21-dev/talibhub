// surahMemorizationControllers.js
const {
  getSurahsByUser,
  updateSurahStatus,
  getRevisionHistory,
  clearRevisionHistory,
  saveKnownSurahs,
  getKnownSurahs,
} = require('../models/surahMemorizationModel');

const getSurahs = async (req, res) => {
  const userId = req.user.id;
  try {
    const surahs = await getSurahsByUser(userId);
    res.json({ surahs });
  } catch (error) {
    console.error('Error fetching surahs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateSurah = async (req, res) => {
  const userId = req.user.id;
  const surahNumber = parseInt(req.params.number, 10);
  const { memorizationLevel, lastRevisionDate } = req.body;

  try {
    await updateSurahStatus(userId, surahNumber, memorizationLevel, lastRevisionDate);
    res.json({ message: 'Surah updated successfully' });
  } catch (error) {
    console.error('Error updating surah:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    const history = await getRevisionHistory(userId);
    res.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const clearHistory = async (req, res) => {
  const userId = req.user.id;
  try {
    await clearRevisionHistory(userId);
    res.json({ message: 'Revision history cleared successfully' });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const saveKnownSurahsController = async (req, res) => {
  const userId = req.user.id;
  const { sourates } = req.body; // Un tableau de numéros de sourates

  try {
    await saveKnownSurahs(userId, sourates);
    res.json({ message: 'Known surahs saved successfully' });
  } catch (error) {
    console.error('Error saving known surahs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getKnownSurahsController = async (req, res) => {
  const userId = req.user.id;
  try {
    const knownSurahs = await getKnownSurahs(userId);
    res.json({ knownSurahs });
  } catch (error) {
    console.error('Error fetching known surahs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export des fonctions du contrôleur
module.exports = {
  getSurahs,
  updateSurah,
  getHistory,
  clearHistory,
  saveKnownSurahs: saveKnownSurahsController,
  getKnownSurahs: getKnownSurahsController,
};
