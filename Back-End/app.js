// backend/app.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const securityMiddleware = require('./middlewares/securityMiddleware');

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
app.options('*', cors());

// Servir les fichiers statiques du Front-End
app.use(express.static(path.join(__dirname, '../Front-End')));

// Servir le dossier 'data' de manière statique
app.use('/data', express.static(path.join(__dirname, 'data')));

// Appliquer le middleware de sécurité
app.use(securityMiddleware);

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const timerRoutes = require('./routes/timerRoutes');
const counterRoutes = require('./routes/counterRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const sourateRoutes = require('./routes/souratesRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const mosqueTimesRoutes = require('./routes/mosqueTimesRoutes');
const surahMemorizationRoutes = require('./routes/surahMemorizationRoutes');
const captchaRoutes = require('./routes/captchaRoutes');


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
app.use('/captcha', captchaRoutes);



// Gérer les erreurs 404
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route non trouvée' });
});

// Gérer les erreurs générales
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).json({ error: 'Erreur de serveur' });
});

// Exporter l'application Express
module.exports = app;