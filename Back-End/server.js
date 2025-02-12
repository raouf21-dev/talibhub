// server.js
const path = require('path');
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
require('dotenv').config({ path: path.join(__dirname, envFile) });


// Debug des variables d'environnement
console.log('Variables d\'environnement chargées:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DB_CONFIG: {
        host: process.env.PGHOST ? 'Défini' : 'Non défini',
        database: process.env.PGDATABASE ? 'Défini' : 'Non défini',
        user: process.env.PGUSER ? 'Défini' : 'Non défini',
        password: process.env.PGPASSWORD ? 'Défini' : 'Non défini'
    }
});

const http = require('http');
const app = require('./app');

// Définir le port sur lequel le serveur va écouter
const PORT = process.env.PORT || 4000;

// Créer un serveur HTTP
const server = http.createServer(app);

// Gestion des erreurs du serveur
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof PORT === 'string'
        ? 'Pipe ' + PORT
        : 'Port ' + PORT;

    // Gestion des erreurs spécifiques avec messages conviviaux
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});

// Démarrage du serveur
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    if (process.env.NODE_ENV === 'development') {
        console.log(`API URL: http://localhost:${PORT}/api`);
    }
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // En développement, on peut laisser crasher l'application
    if (process.env.NODE_ENV === 'production') {
        // En production, on log l'erreur mais on ne crashe pas le serveur
        console.error('Unhandled rejection occurred:', reason);
    } else {
        process.exit(1);
    }
});