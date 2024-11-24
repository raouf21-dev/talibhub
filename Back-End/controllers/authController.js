const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transporter = require('../config/nodemailer'); // Assurez-vous d'avoir configuré Nodemailer

exports.register = async (req, res) => {
    console.log("Données reçues:", req.body);

    const { username, password, email, firstName, lastName, age, gender, country } = req.body;

    console.log("username:", username);
    console.log("password:", password);
    console.log("email:", email);
    console.log("firstName:", firstName);
    console.log("lastName:", lastName);
    console.log("age:", age);
    console.log("gender:", gender);
    console.log("country:", country);


    if (!username || !password || !email || !firstName || !lastName || !age || !gender || !country) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    try {
        const userByUsername = await userModel.getUserByUsername(username);
        if (userByUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const userByEmail = await userModel.getUserByEmail(email);
        if (userByEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        
        // Vérifiez ici que les données sont correctement passées
        console.log({ username, password, email, firstName, lastName, age, gender, country });

        const user = await userModel.createUser(username, password, email, firstName, lastName, age, gender, country);
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        res.status(201).json({ token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'An error occurred during registration' });
    }
};



exports.login = async (req, res) => {
    try {
        console.log('Login attempt:', { email: req.body.email });
        
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis'
            });
        }

        const user = await userModel.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log successful login
        console.log('Login successful for user:', user.email);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la connexion'
        });
    }
};

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.getUserById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Mapper les noms de colonnes de la base de données aux noms de propriétés JavaScript
        const userProfile = {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            age: user.age,
            gender: user.gender
        };

        console.log('User profile being sent:', userProfile);  // Log pour le débogage
        res.status(200).json(userProfile);
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await userModel.getUserById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.updateUserPassword(req.user.id, hashedPassword);

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    try {
        // Si vous utilisez des tokens blacklist, ajoutez le token actuel à la blacklist
        // await blacklistToken(req.token);
        
        res.status(200).json({
            success: true,
            message: 'Déconnexion réussie'
        });
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la déconnexion'
        });
    }
};
