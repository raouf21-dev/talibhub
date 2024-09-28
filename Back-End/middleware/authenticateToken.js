function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    console.log('Authorization Header:', authHeader);

    const token = authHeader && authHeader.split(' ')[1];
    console.log('Extracted Token:', token);

    if (token == null) {
        console.log('No token provided, sending 401');
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT Verification Error:', err.message);
            return res.sendStatus(403); // Forbidden
        }

        console.log('Token is valid. User:', user);
        req.user = user;
        next();
    });
}
