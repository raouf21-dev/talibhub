const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const corsOptions = require('./config/corsConfig');
const cookieParser = require('cookie-parser');
const { attachCookieManager } = require('./middlewares/cookieManager');

require('dotenv').config({
    path: path.join(__dirname, `.env.${process.env.NODE_ENV || 'development'}`)
});

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Vérifier et configurer le cookie secret
if (!process.env.COOKIE_SECRET) {
    if (isProd) {
        throw new Error('COOKIE_SECRET must be defined in environment variables');
    } else {
        process.env.COOKIE_SECRET = 'dev_cookie_secret_' + Math.random().toString(36).slice(2);
        console.warn('⚠️  WARNING: Using auto-generated COOKIE_SECRET in development');
    }
}

app.use(attachCookieManager);

// Configuration de Helmet
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
                "http://www.talibhub.com",
                ...(isProd ? [] : ["http://localhost:*"])
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
                "http://talibhub.com",
                ...(isProd ? [] : ["http://localhost:*", "ws://localhost:*"])
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
}));

app.use(cors(corsOptions));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(bodyParser.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Logger de développement
if (!isProd) {
    app.use((req, res, next) => {
        const sanitizedBody = { ...req.body };
        ['password', 'confirmPassword', 'currentPassword', 'newPassword'].forEach(field => {
            if (sanitizedBody[field]) sanitizedBody[field] = '[MASQUÉ]';
        });
        
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        console.log('Cookies:', req.cookies);
        if (Object.keys(sanitizedBody).length > 0) {
            console.log('Body:', sanitizedBody);
        }
        next();
    });
}

// En-têtes de sécurité
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (isProd) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

// Import des routes
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

// Routes API
app.use('/auth', authRoutes);
app.use('/tasks', tasksRoutes);
app.use('/timer', timerRoutes);
app.use('/counter', counterRoutes);
app.use('/session', sessionRoutes);
app.use('/sourates', sourateRoutes);
app.use('/statistics', statisticsRoutes);
app.use('/mosque-times', mosqueTimesRoutes);
app.use('/surah-memorization', surahMemorizationRoutes);
app.use('/captcha', captchaRoutes);
app.use('/dua-time', duaTimeRoutes);

// Routes statiques
app.use('/api/data', express.static(path.join(__dirname, 'data')));
app.use(express.static(path.join(__dirname, '../Front-End')));

// Configuration des langues
const langConfig = {
    DEFAULT_LANG: 'fr',
    SUPPORTED_LANGS: ['fr', 'en']
};

// Route SPA
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    const userLang = req.acceptsLanguages(langConfig.SUPPORTED_LANGS) || langConfig.DEFAULT_LANG;
    res.sendFile(path.join(__dirname, `../Front-End/index-${userLang}.html`));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    const error = isProd 
        ? { message: 'Une erreur est survenue' }
        : { message: err.message, stack: err.stack };
    res.status(err.status || 500).json({ success: false, error });
});

// Routes non trouvées
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route non trouvée' });
});

module.exports = app;