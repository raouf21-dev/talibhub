const sourateModel = require('../models/sourateModel');

const getAllSourates = async (req, res) => {
    try {
        const sourates = await sourateModel.getAllSourates();
        res.json(sourates);
    } catch (error) {
        console.error('Erreur dans getAllSourates:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getKnownSourates = async (req, res) => {
    try {
        const userId = req.user.id;
        const knownSourates = await sourateModel.getKnownSourates(userId);
        res.json(knownSourates);
    } catch (error) {
        console.error('Erreur dans getKnownSourates:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const updateKnownSourates = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sourates } = req.body;
        await sourateModel.saveKnownSourates(userId, sourates);
        res.json({ message: 'Sourates connues mises à jour avec succès' });
    } catch (error) {
        console.error('Erreur dans updateKnownSourates:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const recordRecitation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstSourate, secondSourate } = req.body;

        // Mettre à jour les compteurs de récitation
        await sourateModel.incrementRecitationCount(userId, firstSourate);
        await sourateModel.incrementRecitationCount(userId, secondSourate);

        // Vérifier si un cycle est complété
        const cycleCompleted = await sourateModel.checkCycleCompletion(userId);

        // Obtenir les statistiques mises à jour
        const stats = await sourateModel.getRecitationStats(userId);

        res.json({
            message: 'Récitation enregistrée avec succès',
            cycleCompleted,
            stats
        });
    } catch (error) {
        console.error('Erreur dans recordRecitation:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

const getRecitationStats = async (req, res) => {
    try {
        console.log('Début de getRecitationStats');
        const userId = req.user.id;
        console.log('UserId:', userId);
        const stats = await sourateModel.getRecitationStats(userId);
        console.log('Stats récupérées:', stats);
        res.json(stats);
    } catch (error) {
        console.error('Erreur détaillée dans getRecitationStats:', error);
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};
const getRecitationHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await sourateModel.getRecitationHistory(userId);
        res.json(history);
    } catch (error) {
        console.error('Erreur dans getRecitationHistory:', error);
        res.status(500).json({ error: 'Erreur serveur' });
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
                recitedAtLeastOnce: stats.recited_at_least_once
            }
        });
    } catch (error) {
        console.error('Erreur dans getRecitationInfo:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = {
    getAllSourates,
    getKnownSourates,
    updateKnownSourates,
    recordRecitation,
    getRecitationStats,
    getRecitationHistory,
    getRecitationInfo
};