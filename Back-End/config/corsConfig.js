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
        
        // Permettre les requêtes sans origine (comme Postman) en développement
        if (!origin && process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        if (allowed.includes(origin)) {
            callback(null, origin);  // Important : renvoyer l'origine exacte, pas juste true
        } else {
            console.warn(`Origine rejetée par CORS: ${origin}`);
            callback(new Error(`Origine non autorisée: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
    maxAge: 86400
};

module.exports = corsOptions;