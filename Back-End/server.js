// server.js

const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement au tout début
dotenv.config({ path: path.join(__dirname, '.env') });

const http = require('http');
const app = require('./app');

// Vérifier que les variables d'environnement sont bien définies
//console.log('Port:', process.env.PORT);
//console.log('Database URL:', process.env.DATABASE_URL);

// Définir le port sur lequel le serveur va écouter
const PORT = process.env.PORT || 4000;

// Créer un serveur HTTP et démarrer l'écoute sur le port configuré
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
