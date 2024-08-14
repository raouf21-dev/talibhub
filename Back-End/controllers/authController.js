const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transporter = require('../config/nodemailer'); // Assurez-vous d'avoir configuré Nodemailer

exports.register = async (req, res) => {
    console.log("Données reçues:", req.body);

    const { username, password, email, firstName, lastName, age, gender } = req.body;

    console.log("username:", username);
    console.log("password:", password);
    console.log("email:", email);
    console.log("firstName:", firstName);
    console.log("lastName:", lastName);
    console.log("age:", age);
    console.log("gender:", gender);

    if (!username || !password || !email || !firstName || !lastName || !age || !gender) {
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
        console.log({ username, password, email, firstName, lastName, age, gender });

        const user = await userModel.createUser(username, password, email, firstName, lastName, age, gender);
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        res.status(201).json({ token });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'An error occurred during registration' });
    }
};



exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        const user = await userModel.getUserByEmail(email);

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        res.status(200).json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
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
