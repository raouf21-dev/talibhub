// config/corsConfig.js

const allowedOrigins = {
    development: [
        'http://localhost:4000',
        'http://localhost:3000',
        'http://127.0.0.1:4000'
    ],
    production: [
        process.env.FRONTEND_URL,
        // autres domaines de production si nécessaire
    ]
};

const corsOptions = {
    origin: function (origin, callback) {
        // Récupérer les origines autorisées selon l'environnement
        const allowed = allowedOrigins[process.env.NODE_ENV || 'development'];
        
        // Autoriser les requêtes sans origine (comme les appels API directs)
        if (!origin) {
            return callback(null, true);
        }
        
        if (allowed.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`Origine non autorisée: ${origin}`);
            callback(new Error('Non autorisé par CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
    maxAge: 3600 // 1 heure
};

module.exports = corsOptions;