const getCookieOptions = () => {
    const baseOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    };

    // En production
    if (process.env.NODE_ENV === 'production') {
        return {
            ...baseOptions,
            domain: 'talibhub.com', // Sans le point pour permettre www et non-www
            secure: true
        };
    }

    // En développement
    return {
        ...baseOptions,
        secure: false
    };
};

const cookieManager = {
    setAuthCookies(res, token) {
        const options = getCookieOptions();
        
        // Cookie HTTP-only pour le token
        res.cookie('auth_token', token, options);
        
        // Cookie accessible en JavaScript
        res.cookie('auth', 'true', { 
            ...options, 
            httpOnly: false 
        });
    },

    clearAuthCookies(res) {
        const options = getCookieOptions();
        res.clearCookie('auth_token', options);
        res.clearCookie('auth', options);
    },

    getAuthToken(req) {
        // Priorité au cookie, puis au header Authorization
        return req.cookies.auth_token || 
               (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    },

    setSelectedCity(res, city) {
        const options = {
            ...getCookieOptions(),
            httpOnly: false
        };
        res.cookie('selected_city', city, options);
    },

    clearSelectedCity(res) {
        const options = getCookieOptions();
        res.clearCookie('selected_city', options);
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