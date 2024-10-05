// autoScraping.js

const cron = require('node-cron');
const MosqueTimesController = require('./controllers/mosqueTimesController');

// Exécute le scraping tous les jours à minuit
cron.schedule('0 0 * * *', async () => {
  try {
    await MosqueTimesController.scrapeAllCities();
    console.log('Scraping automatique terminé avec succès');
  } catch (error) {
    console.error('Erreur lors du scraping automatique :', error);
  }
});
