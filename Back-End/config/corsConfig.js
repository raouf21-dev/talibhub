// config/corsConfig.js

const allowedOrigins = {
    development: [
        'http://localhost:4000',
        'http://localhost:3000',
        'http://127.0.0.1:4000',
        'http://45.133.178.159'
    ],
    production: [
        process.env.FRONTEND_URL,
        'http://45.133.178.159'
        // autres domaines de production si nécessaire
    ]
};

const corsOptions = {
    origin: function(origin, callback) {
        const allowed = allowedOrigins[process.env.NODE_ENV || 'development'];
        
        if (!origin || allowed.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Non autorisé par CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie'],
    maxAge: 86400 // 24 heures
};

module.exports = corsOptions;