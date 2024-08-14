const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');

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
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const timerRoutes = require('./routes/timer');
const counterRoutes = require('./routes/counter');
const sessionRoutes = require('./routes/session');
const sourateRoutes = require('./routes/sourates');

// Utiliser les routes
app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);
app.use('/timer', timerRoutes);
app.use('/counter', counterRoutes);
app.use('/session', sessionRoutes);
app.use('/sourates', sourateRoutes);


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
