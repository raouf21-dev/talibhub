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
        // En développement
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        // En production
        const allowed = allowedOrigins.production;
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Origine rejetée par CORS: ${origin}`);
            callback(new Error('Non autorisé par CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400
};

module.exports = corsOptions;