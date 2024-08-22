const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

function authenticateToken(req, res, next) {
    // Log de l'en-tête Authorization complet
    const authHeader = req.headers['authorization'];

    // Extraction et log du token
    const token = authHeader && authHeader.split(' ')[1];


    // Vérification si le token est null
    if (token == null) {
        console.log('No token provided, sending 401');
        return res.sendStatus(401); // Unauthorized
    }

    // Vérification et décode du token JWT
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.sendStatus(403); // Forbidden
        }

        // Log des informations utilisateur décryptées


        // Attacher les informations utilisateur à l'objet req
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
