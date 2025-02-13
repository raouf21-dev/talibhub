// middlewares/authenticateToken.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
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