// config/nodemailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'in-v3.mailjet.com',
  port: 587,
  secure: false, // Utilise STARTTLS, ce qui est recommandé sur le port 587
  auth: {
    user: process.env.MAILJET_API_KEY,    // Votre clé API Mailjet
    pass: process.env.MAILJET_API_SECRET   // Votre secret API Mailjet
  }
});

module.exports = transporter;
