// config/corsConfig.js

const allowedOrigins = {
    development: [
        'http://localhost:4000',
        'http://localhost:3000',
        'http://127.0.0.1:4000'
    ],
    production: [
        'https://talibhub.com',
        'http://talibhub.com',
        'https://www.talibhub.com',
        'http://www.talibhub.com'
    ]
};

const corsOptions = {
    origin: function(origin, callback) {
        // En développement, permettre les requêtes sans origine (comme Postman)
        if (!origin && process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        const allowed = allowedOrigins[process.env.NODE_ENV || 'development'];
        
        if (allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origine non autorisée par CORS: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie'],
    maxAge: 86400 // 24 heures
};

module.exports = corsOptions;