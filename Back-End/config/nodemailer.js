// config/nodemailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAILERSEND_SMTP_SERVER, // par ex. "smtp.mailersend.net"
  port: Number(process.env.MAILERSEND_SMTP_PORT), // par ex. 587
  secure: Number(process.env.MAILERSEND_SMTP_PORT) === 465, // true pour le port 465, sinon false
  auth: {
    user: process.env.MAILERSEND_SMTP_USERNAME, // votre identifiant SMTP
    pass: process.env.MAILERSEND_SMTP_PASSWORD  // votre mot de passe SMTP
  }
});

module.exports = transporter;
