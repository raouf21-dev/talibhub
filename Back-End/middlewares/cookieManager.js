// middlewares/cookieManager.js

const getCookieOptions = () => {
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // En production, via HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    };
  
    // En production, définissez le domaine explicitement sans le point initial.
    // Cela garantit que le cookie est associé au domaine "talibhub.com".
    if (process.env.NODE_ENV === 'production') {
      options.domain = 'talibhub.com';
    }
    
    return options;
  };
  
  const cookieManager = {
    setAuthCookies(res, token) {
      const options = getCookieOptions();
      res.cookie('auth_token', token, options);
      res.cookie('auth', 'true', { ...options, httpOnly: false });
    },
  
    clearAuthCookies(res) {
      res.clearCookie('auth_token', { path: '/' });
      res.clearCookie('auth', { path: '/' });
    },
  
    getAuthToken(req) {
      return req.cookies.auth_token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    },
  
    // Fonctions pour la ville sélectionnée
    setSelectedCity(res, city) {
      const options = { ...getCookieOptions(), httpOnly: false };
      res.cookie('selected_city', city, options);
    },
  
    clearSelectedCity(res) {
      res.clearCookie('selected_city', { path: '/' });
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
  