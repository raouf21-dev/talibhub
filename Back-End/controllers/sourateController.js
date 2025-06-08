//sourateController.js

const sourateModel = require("../models/sourateModel");

const getAllSourates = async (req, res) => {
  try {
    const sourates = await sourateModel.getAllSourates();
    res.json(sourates);
  } catch (error) {
    console.error("Erreur dans getAllSourates:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const getKnownSourates = async (req, res) => {
  try {
    const userId = req.user.id;
    const knownSourates = await sourateModel.getKnownSourates(userId);
    res.json(knownSourates);
  } catch (error) {
    console.error("Erreur dans getKnownSourates:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const updateKnownSourates = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sourates } = req.body;
    await sourateModel.saveKnownSourates(userId, sourates);
    res.json({ message: "Sourates connues mises à jour avec succès" });
  } catch (error) {
    console.error("Erreur dans updateKnownSourates:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const recordRecitation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstSourate, secondSourate } = req.body;

    const cycleCompleted = await sourateModel.recordRecitation(
      userId,
      firstSourate,
      secondSourate
    );

    // Obtenir les statistiques mises à jour
    const stats = await sourateModel.getRecitationStats(userId);

    res.json({
      message: "Récitation enregistrée avec succès",
      cycleCompleted,
      stats,
    });
  } catch (error) {
    console.error("Erreur dans recordRecitation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const getRecitationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await sourateModel.getRecitationStats(userId);
    res.json(stats);
  } catch (error) {
    console.error("Erreur dans getRecitationStats:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const getRecitationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await sourateModel.getRecitationHistory(userId);
    res.json(history);
  } catch (error) {
    console.error("Erreur dans getRecitationHistory:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const getRecitationInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await sourateModel.getRecitationStats(userId);
    res.json({
      cycles: stats.complete_cycles,
      progress: {
        totalKnown: stats.total_known,
        recitedAtLeastOnce: stats.recited_at_least_once,
      },
    });
  } catch (error) {
    console.error("Erreur dans getRecitationInfo:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const getNotRecitedSourates = async (req, res) => {
  try {
    const userId = req.user.id;
    const notRecitedSourates = await sourateModel.getNotRecitedSourates(userId);
    res.json(notRecitedSourates);
  } catch (error) {
    console.error("Erreur dans getNotRecitedSourates:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const startNewCycle = async (req, res) => {
  try {
    const userId = req.user.id;
    await sourateModel.startNewCycle(userId);
    res.json({ message: "Nouveau cycle démarré avec succès" });
  } catch (error) {
    console.error("Erreur dans startNewCycle:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const getSouratesByNumbers = async (req, res) => {
  try {
    const { sourateNumbers } = req.body;
    const sourates = await sourateModel.getSouratesByNumbers(sourateNumbers);
    res.json(sourates);
  } catch (error) {
    console.error("Erreur dans getSouratesByNumbers:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const getMemorizationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await sourateModel.getMemorizationStatus(userId);
    res.json(status);
  } catch (error) {
    console.error("Erreur dans getMemorizationStatus:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const updateMemorizationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const sourateNumber = parseInt(req.params.number);
    const { memorizationLevel, lastRevisionDate } = req.body;
    await sourateModel.updateMemorizationStatus(
      userId,
      sourateNumber,
      memorizationLevel,
      lastRevisionDate
    );
    res.json({ message: "Statut de mémorisation mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur dans updateMemorizationStatus:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const getMemorizationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await sourateModel.getMemorizationHistory(userId);
    res.json(history);
  } catch (error) {
    console.error("Erreur dans getMemorizationHistory:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const clearMemorizationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    await sourateModel.clearMemorizationHistory(userId);
    res.json({ message: "Historique de mémorisation effacé avec succès" });
  } catch (error) {
    console.error("Erreur dans clearMemorizationHistory:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// N'oubliez pas d'exporter les nouvelles fonctions
module.exports = {
  getAllSourates,
  getKnownSourates,
  updateKnownSourates,
  recordRecitation,
  getRecitationStats,
  getRecitationHistory,
  getRecitationInfo,
  getNotRecitedSourates,
  startNewCycle,
  getSouratesByNumbers,
  getMemorizationStatus,
  updateMemorizationStatus,
  getMemorizationHistory,
  clearMemorizationHistory,
};
