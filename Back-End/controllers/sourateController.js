const Sourate = require('../models/sourateModel');

const getAllSourates = async (req, res) => {
    try {
        const sourates = await Sourate.getAllSourates();
        console.log(sourates); // Loggez la sortie pour le debugging
        res.json(sourates);
    } catch (err) {
        console.error('Erreur:', err);
        res.status(500).json({ error: 'Erreur de serveur' });
    }
};


const getKnownSourates = async (req, res) => {
    try {
        const userId = req.user.id; // Assurez-vous que l'utilisateur est authentifié
        const sourates = await Sourate.getKnownSourates(userId);
        res.json(sourates);
    } catch (err) {
        res.status(500).json({ error: 'Erreur de serveur' });
    }
};

const saveKnownSourates = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Saving sourates for user:', userId); // Ajout de log
        const { sourates } = req.body;
        console.log('Sourates to save:', sourates); // Ajout de log
        await Sourate.saveKnownSourates(userId, sourates);
        res.json({ message: 'Sourates connues sauvegardées avec succès' });
    } catch (err) {
        console.error('Error in saveKnownSourates:', err); // Ajout de log
        res.status(500).json({ error: 'Erreur de serveur' });
    }
};


module.exports = {
    getAllSourates,
    getKnownSourates,
    saveKnownSourates
};
