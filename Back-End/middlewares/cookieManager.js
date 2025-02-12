// middlewares/cookieManager.js

// Fonction qui retourne les options des cookies.
// En production, on définit explicitement le domaine pour qu'il corresponde à '.talibhub.com'.
// Cela permet que le cookie soit valide pour "talibhub.com" et "www.talibhub.com".
// En développement, aucun domaine n'est défini.
const getCookieOptions = () => {
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // En production, le cookie est envoyé uniquement via HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    };
  
    // En production, définir le domaine explicitement.
    if (process.env.NODE_ENV === 'production') {
      // Le point préfixé indique que le cookie est valable pour tous les sous-domaines.
      options.domain = '.talibhub.com';
    }
    
    return options;
  };
  
  const cookieManager = {
    // Définit le cookie d'authentification (HTTP-only) et un cookie accessible en JavaScript pour vérification côté client.
    setAuthCookies(res, token) {
      const options = getCookieOptions();
      res.cookie('auth_token', token, options);
      res.cookie('auth', 'true', { ...options, httpOnly: false });
    },
  
    // Efface les cookies d'authentification.
    clearAuthCookies(res) {
      res.clearCookie('auth_token', { path: '/' });
      res.clearCookie('auth', { path: '/' });
    },
  
    // Récupère le token d'authentification depuis les cookies ou le header Authorization.
    getAuthToken(req) {
      return req.cookies.auth_token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    },
  
    // --- Fonctions pour gérer la ville sélectionnée ---
  
    // Définit le cookie "selected_city" (non HTTP-only, pour être accessible côté client).
    setSelectedCity(res, city) {
      const options = { ...getCookieOptions(), httpOnly: false };
      res.cookie('selected_city', city, options);
    },
  
    // Efface le cookie "selected_city".
    clearSelectedCity(res) {
      res.clearCookie('selected_city', { path: '/' });
    },
  
    // Récupère le cookie "selected_city".
    getSelectedCity(req) {
      return req.cookies.selected_city;
    }
  };
  
  // Middleware pour attacher le cookieManager à l'objet réponse.
  const attachCookieManager = (req, res, next) => {
    res.cookieManager = cookieManager;
    next();
  };
  
  module.exports = {
    cookieManager,
    attachCookieManager
  };
  