// app.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const corsOptions = require('./config/corsConfig');
const cookieParser = require('cookie-parser');
const { attachCookieManager } = require('./middlewares/cookieManager');


require('dotenv').config();

// Création de l'application Express
const app = express();

app.use(attachCookieManager);

// Middlewares de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "'unsafe-eval'", 
                "https://unpkg.com", 
                "https://cdnjs.cloudflare.com",
                "https://www.talibhub.com",
                "http://www.talibhub.com"
            ],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://unpkg.com", 
                "https://cdnjs.cloudflare.com",
                "https://www.talibhub.com",
                "http://www.talibhub.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: [
                "'self'", 
                "https://api.example.com", 
                "https://api.aladhan.com",
                "https://www.talibhub.com",
                "http://www.talibhub.com",
                "https://talibhub.com",
                "http://talibhub.com"
            ],
            fontSrc: [
                "'self'", 
                "https://cdnjs.cloudflare.com", 
                "data:",
                "https://www.talibhub.com",
                "http://www.talibhub.com"
            ],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: [
                "'self'",
                "https://www.talibhub.com",
                "http://www.talibhub.com"
            ],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));;

app.use(cors(corsOptions));

app.use(cookieParser());

// Configuration des parsers
app.use(bodyParser.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logger pour le développement
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        /*console.log('Body:', req.body);*/
        next();
    });
}

// En-têtes de sécurité supplémentaires
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const tasksRoutes = require('./routes/tasksRoutes');
const timerRoutes = require('./routes/timerRoutes');
const counterRoutes = require('./routes/counterRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const sourateRoutes = require('./routes/souratesRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const mosqueTimesRoutes = require('./routes/mosqueTimesRoutes');
const surahMemorizationRoutes = require('./routes/surahMemorizationRoutes');
const captchaRoutes = require('./routes/captchaRoutes');
const duaTimeRoutes = require('./routes/duaTimeRoutes');

// AJOUTEZ LE NOUVEAU MIDDLEWARE DE LOGGING ICI, après les parsers mais avant les routes
/*app.use((req, res, next) => {
    console.log('Full request details:');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);
    console.log('Body:', req.body);
    console.log('Query:', req.query);
    next();
});*/


// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/timer', timerRoutes);
app.use('/api/counter', counterRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/sourates', sourateRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/mosque-times', mosqueTimesRoutes);
app.use('/api/surah-memorization', surahMemorizationRoutes);
app.use('/api/captcha', captchaRoutes);
app.use('/api/dua-time', duaTimeRoutes);

// Route pour les données statiques
app.use('/api/data', express.static(path.join(__dirname, 'data')));

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../Front-End')));

// Configuration des langues
const langConfig = {
    DEFAULT_LANG: 'fr',
    SUPPORTED_LANGS: ['fr', 'en']
};

// Route catch-all pour le SPA avec gestion de la langue
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
        return next();
    }
    const userLang = req.acceptsLanguages(langConfig.SUPPORTED_LANGS) || langConfig.DEFAULT_LANG;
    res.sendFile(path.join(__dirname, `../Front-End/index-${userLang}.html`));
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    
    // Ne pas exposer les détails de l'erreur en production
    const error = process.env.NODE_ENV === 'development' 
        ? { message: err.message, stack: err.stack }
        : { message: 'Une erreur est survenue' };

    res.status(err.status || 500).json({
        success: false,
        error
    });
});

// Gestion des routes non trouvées
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée'
    });
});

module.exports = app;