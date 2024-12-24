// middlewares/authenticateToken.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    /*console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);*/
    
    const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
    
    /*console.log('Token found:', token ? 'Yes' : 'No');*/
    
    if (!token) {
        console.log('Authentication failed: No token found');
        return res.status(401).json({
            success: false,
            message: 'Aucun token trouvé. Veuillez vous connecter.'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('Token verification failed:', err.message);
            return res.status(403).json({
                success: false,
                message: 'Token invalide ou expiré. Veuillez vous reconnecter.'
            });
        }
        console.log('Authentication successful for user:', user);
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken }; 