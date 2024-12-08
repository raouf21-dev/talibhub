// controllers/authController.js
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transporter = require('../config/nodemailer');
const { cookieManager } = require('../middlewares/cookieManager');

exports.register = async (req, res) => {
    console.log("Données reçues:", req.body);
    const { username, password, email, firstName, lastName, age, gender, country } = req.body;

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

        const user = await userModel.createUser(username, password, email, firstName, lastName, age, gender, country);
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        
        // Utiliser le cookieManager pour définir les cookies
        cookieManager.setAuthCookies(res, token);

        res.status(201).json({ token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'An error occurred during registration' });
    }
};

exports.login = async (req, res) => {
    try {
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

        // Utiliser le cookieManager pour définir les cookies
        cookieManager.setAuthCookies(res, token);

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

exports.logout = async (req, res) => {
    try {
        // Utiliser le cookieManager pour effacer les cookies
        cookieManager.clearAuthCookies(res);
        
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

exports.refreshToken = async (req, res) => {
    try {
        const oldToken = cookieManager.getAuthToken(req);
        
        if (!oldToken) {
            return res.status(401).json({ message: 'Aucun token à rafraîchir' });
        }

        const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
        const newToken = jwt.sign(
            { id: decoded.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        cookieManager.setAuthCookies(res, newToken);

        res.status(200).json({
            success: true,
            token: newToken
        });
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token:', error);
        res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré'
        });
    }
};

exports.verify = async (req, res) => {
    try {
        const token = cookieManager.getAuthToken(req);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Aucun token trouvé'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.getUserById(decoded.id);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        console.error('Erreur de vérification du token:', error);
        return res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré'
        });
    }
};

// Les autres méthodes restent inchangées (getProfile, changePassword)
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.getUserById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userProfile = {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            age: user.age,
            gender: user.gender
        };

        console.log('User profile being sent:', userProfile);
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

module.exports = {
    login: exports.login,
    register: exports.register,
    refreshToken: exports.refreshToken,
    logout: exports.logout,
    getProfile: exports.getProfile,
    changePassword: exports.changePassword,
    verify: exports.verify
};