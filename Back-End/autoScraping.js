// autoScraping.js

const cron = require('node-cron');
const MosqueTimesController = require('./controllers/mosqueTimesController');

// Exécute le scraping tous les jours à minuit
cron.schedule('0 0 * * *', () => {
  MosqueTimesController.scrapePrayerTimes();
});