// middlewares/cookieManager.js

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    domain: process.env.NODE_ENV === 'production' ? '45.133.178.159' : 'localhost'
};

const cookieManager = {
    setAuthCookies(res, token) {
        // Cookie HTTP-only pour la sécurité
        res.cookie('auth_token', token, cookieOptions);
        
        // Cookie accessible en JavaScript pour la vérification côté client
        res.cookie('auth', 'true', {
            ...cookieOptions,
            httpOnly: false
        });
    },

    // Nouvelle méthode pour gérer la ville sélectionnée
    setSelectedCity(res, city) {
        res.cookie('selected_city', city, {
            ...cookieOptions,
            httpOnly: false // Permettre l'accès côté client
        });
    },

    clearAuthCookies(res) {
        res.clearCookie('auth_token', { path: '/' });
        res.clearCookie('auth', { path: '/' });
    },

    clearSelectedCity(res) {
        res.clearCookie('selected_city', { path: '/' });
    },

    getAuthToken(req) {
        return req.cookies.auth_token || req.headers.authorization?.split(' ')[1];
    },

    getSelectedCity(req) {
        return req.cookies.selected_city;
    }
};

// Middleware pour attacher les méthodes de gestion des cookies à l'objet response
const attachCookieManager = (req, res, next) => {
    res.cookieManager = cookieManager;
    next();
};

module.exports = {
    cookieManager,
    attachCookieManager
};