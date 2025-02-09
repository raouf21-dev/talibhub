// middlewares/cookieManager.js

// Fonction pour obtenir le domaine en fonction de l'environnement
const getDomain = () => {
    if (process.env.NODE_ENV === 'production') {
        return '.talibhub.com';
    }
    // En développement, ne pas définir de domaine pour localhost
    return undefined;
};

// Configuration de base des cookies
const getCookieOptions = () => {
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    };

    // Ajouter le domaine uniquement en production
    const domain = getDomain();
    if (domain) {
        options.domain = domain;
    }

    return options;
};

const cookieManager = {
    setAuthCookies(res, token) {
        const options = getCookieOptions();
        
        // Cookie HTTP-only pour la sécurité
        res.cookie('auth_token', token, options);
        
        // Cookie accessible en JavaScript pour la vérification côté client
        res.cookie('auth', 'true', {
            ...options,
            httpOnly: false
        });
    },

    clearAuthCookies(res) {
        const options = {
            ...getCookieOptions(),
            path: '/'
        };

        res.clearCookie('auth_token', options);
        res.clearCookie('auth', options);
    },

    setSelectedCity(res, city) {
        const options = {
            ...getCookieOptions(),
            httpOnly: false
        };
        res.cookie('selected_city', city, options);
    },

    clearSelectedCity(res) {
        const options = {
            ...getCookieOptions(),
            path: '/'
        };
        res.clearCookie('selected_city', options);
    },

    getAuthToken(req) {
        return req.cookies.auth_token || req.headers.authorization?.split(' ')[1];
    },

    getSelectedCity(req) {
        return req.cookies.selected_city;
    }
};

const attachCookieManager = (req, res, next) => {
    res.cookieManager = cookieManager;
    next();
};

module.exports = {
    cookieManager,
    attachCookieManager
};