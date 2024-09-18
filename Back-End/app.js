// app.js

const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const { scrapePrayerTimes } = require('./controllers/mosqueTimesController');


// Charger les variables d'environnement
dotenv.config();

const { PORT } = process.env;

// Créer l'application Express
const app = express();

// Appliquer CORS à toutes les routes
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));

// Configurer les middlewares
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));


// Importer les routes
const authRoutes = require('./routes/authRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const timerRoutes = require('./routes/timerRoutes');
const counterRoutes = require('./routes/counterRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const sourateRoutes = require('./routes/souratesRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes')
const mosqueTimesRoutes = require('./routes/mosqueTimesRoutes');
const surahMemorizationRoutes = require('./routes/surahMemorizationRoutes');


// Utiliser les routes
app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);
app.use('/timer', timerRoutes);
app.use('/counter', counterRoutes);
app.use('/session', sessionRoutes);
app.use('/sourates', sourateRoutes);
app.use('/statistics', statisticsRoutes);
app.use('/mosque-times', mosqueTimesRoutes);
app.use('/surah-memorization', surahMemorizationRoutes);




// Gérer les erreurs 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gérer les erreurs générales
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ error: 'Erreur de serveur' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;

// Exécute le scraping tous les jours à minuit
cron.schedule('0 0 * * *', async () => {
  try {
    await scrapePrayerTimes();
    console.log('Automatic scraping completed successfully');
  } catch (error) {
    console.error('Error during automatic scraping:', error);
  }
});