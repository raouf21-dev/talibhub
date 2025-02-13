// config/corsConfig.js

const allowedOrigins = {
    development: [
        'http://localhost:4000',
        'http://localhost:3000',
        'http://127.0.0.1:4000'
    ],
    production: [
        'https://talibhub.com',
        'https://www.talibhub.com'
    ]
};

const corsOptions = {
    origin: function(origin, callback) {
        const allowed = allowedOrigins[process.env.NODE_ENV || 'development'];
        
        // En développement, permettre les requêtes sans origine
        if ((!origin && process.env.NODE_ENV === 'development') || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Non autorisé par CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400
};

module.exports = corsOptions;