// middlewares/cookieManager.js

// Fonction qui retourne les options des cookies sans définir explicitement le domaine
const getCookieOptions = () => {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // En production, les cookies seront envoyés uniquement via HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    };
  };
  
  const cookieManager = {
    // Définit le cookie d'authentification (HTTP-only) et un cookie accessible en JS (pour la vérification côté client)
    setAuthCookies(res, token) {
      const options = getCookieOptions();
      res.cookie('auth_token', token, options);
      res.cookie('auth', 'true', { ...options, httpOnly: false });
    },
  
    // Efface les cookies d'authentification
    clearAuthCookies(res) {
      res.clearCookie('auth_token', { path: '/' });
      res.clearCookie('auth', { path: '/' });
    },
  
    // Récupère le token d'authentification depuis les cookies ou le header Authorization
    getAuthToken(req) {
      return req.cookies.auth_token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    },
  
    // *** Ajout des fonctions pour gérer la ville sélectionnée ***
  
    // Définit le cookie "selected_city" (non HTTP-only, pour être accessible côté client)
    setSelectedCity(res, city) {
      const options = { ...getCookieOptions(), httpOnly: false };
      res.cookie('selected_city', city, options);
    },
  
    // Efface le cookie "selected_city"
    clearSelectedCity(res) {
      res.clearCookie('selected_city', { path: '/' });
    },
  
    // Récupère le cookie "selected_city"
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
  