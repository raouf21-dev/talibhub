// Back-End/middlewares/securityMiddleware.js
// Ce fichier intercepte les requêtes et applique la détection
const botDetection = require('../bot-detection');

const securityMiddleware = async (req, res, next) => {
    // Ne vérifier que les routes d'inscription
    if (req.path === '/api/auth/register' && req.method === 'POST') {
        const metrics = req.body.metrics;
        const ip = req.ip || req.connection.remoteAddress;
        
        const botCheck = botDetection.checkBotBehavior(metrics);
        
        if (botCheck.isSuspicious) {
            await botDetection.logSuspiciousActivity(ip, 'Tentative d\'inscription suspecte', {
                issues: botCheck.issues,
                metrics,
                userAgent: req.headers['user-agent']
            });
            
            return res.status(403).json({
                error: 'Activité suspecte détectée',
                message: 'La requête a été bloquée pour des raisons de sécurité'
            });
        }
    }
    
    next();
};

module.exports = securityMiddleware;