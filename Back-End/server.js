// server.js
const http = require('http');
const app = require('./app');

// Définir le port sur lequel le serveur va écouter
const PORT = process.env.PORT || 3000;

// Créer un serveur HTTP et démarrer l'écoute sur le port configuré
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
