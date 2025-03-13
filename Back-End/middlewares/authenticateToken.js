// middlewares/authenticateToken.js
const jwt = require('jsonwebtoken');

// Liste des routes publiques
const publicRoutes = [
  '/api/mosque-times/cities/search',
  '/api/mosque-times/cities/:city/mosques',
  '/api/mosque-times/exists/:date',
  '/api/mosque-times/report-missing-data/:date'
];

// Fonction pour vérifier si une route est publique
const isPublicRoute = (path) => {
  return publicRoutes.some(publicPath => {
    const pattern = publicPath
      .replace(/:\w+/g, '[^/]+')
      .replace(/\//g, '\\/');
    return new RegExp(`^${pattern}$`).test(path);
  });
};

const authenticateToken = (req, res, next) => {
    // Vérifier d'abord si c'est une route publique
    if (isPublicRoute(req.path)) {
        console.log(`[AUTH] Route publique autorisée: ${req.path}`);
        return next();
    }

    console.log(`[AUTH] Vérification d'authentification pour: ${req.path}`);
    
    let token = req.cookies?.auth_token;
    
    // Si pas de cookie, vérifier le header Authorization
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        token = authHeader.startsWith('Bearer ') ? 
            authHeader.split(' ')[1] : 
            authHeader;
    }
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Aucun token trouvé. Veuillez vous connecter.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Token invalide ou expiré. Veuillez vous reconnecter.'
        });
    }
};

module.exports = { authenticateToken }; 