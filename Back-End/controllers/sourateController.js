const Sourate = require('../models/sourateModel');

const getAllSourates = async (req, res) => {
    try {
        const sourates = await Sourate.getAllSourates();
        res.json(sourates);
    } catch (err) {
        console.error('Erreur:', err);
        res.status(500).json({ error: 'Erreur de serveur' });
    }
};

const getKnownSourates = async (req, res) => {
    try {
        const userId = req.user.id;
        const sourates = await Sourate.getKnownSourates(userId);
        res.json(sourates);
    } catch (err) {
        res.status(500).json({ error: 'Erreur de serveur' });
    }
};

const saveKnownSourates = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sourates } = req.body;
        await Sourate.saveKnownSourates(userId, sourates);
        res.json({ message: 'Sourates connues sauvegardées avec succès' });
    } catch (err) {
        console.error('Error in saveKnownSourates:', err);
        res.status(500).json({ error: 'Erreur de serveur' });
    }
};


const selectRandomSourates = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstSourate, secondSourate } = req.body;
        
        if (!firstSourate || !secondSourate || firstSourate === secondSourate) {
            return res.status(400).json({ error: 'Sélection de sourates invalide' });
        }
        
        const cycleCompleted = await Sourate.updateRecitationCount(userId, firstSourate, secondSourate);
        const stats = await Sourate.getRecitationStats(userId);
        
        res.json({ 
            message: 'Sélection enregistrée', 
            cycleCompleted,
            recitedAtLeastOnce: stats.recited_at_least_once,
            totalKnown: stats.total_known
        });
    } catch (err) {
        console.error('Erreur dans selectRandomSourates:', err);
        res.status(500).json({ error: 'Erreur de serveur' });
    }
};

const getRecitationHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await Sourate.getRecitationHistory(userId);
        res.json(history);
    } catch (err) {
        console.error('Erreur dans getRecitationHistory:', err);
        res.status(500).json({ error: 'Erreur de serveur' });
    }
};

const getRecitationInfo = async (req, res) => {
    try {
        const userId = req.user.id;
        const cycles = await Sourate.getRecitationCycles(userId);
        const progress = await Sourate.getRecitationProgress(userId);
        res.json({ 
            cycles, 
            progress: {
                totalKnown: progress.total_known,
                recitedAtLeastOnce: progress.recited_at_least_once
            }
        });
    } catch (err) {
        console.error('Erreur dans getRecitationInfo:', err);
        res.status(500).json({ error: 'Erreur de serveur' });
    }
};

const getRecitationStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await Sourate.getRecitationStats(userId);
        res.json(stats);
    } catch (err) {
        console.error('Erreur dans getRecitationStats:', err);
        res.status(500).json({ error: 'Erreur de serveur' });
    }
};

module.exports = {
    getAllSourates,
    getKnownSourates,
    saveKnownSourates,
    selectRandomSourates,
    getRecitationHistory,
    getRecitationInfo,
    getRecitationStats
};