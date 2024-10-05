//nodemailer.js

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'outlook365',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

module.exports = transporter;
