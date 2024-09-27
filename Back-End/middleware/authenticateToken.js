//authenticateToken.js

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    console.log('Authorization Header:', authHeader); // Log the full header

    const token = authHeader && authHeader.split(' ')[1];
    console.log('Extracted Token:', token); // Log the extracted token

    if (token == null) {
        console.log('No token provided, sending 401');
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.sendStatus(403); // Forbidden
        }

        req.user = user;
        next();
    });
}


module.exports = authenticateToken;
