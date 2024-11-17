// captchaController.js 

const crypto = require('crypto');

// Store temporaire pour les CAPTCHAs (en production, utilisez Redis)
const captchaStore = new Map();

exports.generateCaptcha = (req, res) => {
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, answer;

    switch(operation) {
        case '+':
            num1 = Math.floor(Math.random() * 50) + 1;
            num2 = Math.floor(Math.random() * 50) + 1;
            answer = num1 + num2;
            break;
        case '-':
            num1 = Math.floor(Math.random() * 50) + 50;
            num2 = Math.floor(Math.random() * num1);
            answer = num1 - num2;
            break;
        case '*':
            num1 = Math.floor(Math.random() * 12) + 1;
            num2 = Math.floor(Math.random() * 12) + 1;
            answer = num1 * num2;
            break;
    }

    const captchaId = crypto.randomBytes(16).toString('hex');
    const problem = `${num1} ${operation} ${num2}`;

    captchaStore.set(captchaId, {
        answer,
        timestamp: Date.now(),
        attempts: 0
    });

    // Nettoyage des anciens CAPTCHAs
    cleanupOldCaptchas();

    res.json({ captchaId, problem });
};

exports.verifyCaptcha = (req, res) => {
    const { captchaId, answer } = req.body;
    const captcha = captchaStore.get(captchaId);

    if (!captcha) {
        return res.json({ valid: false, message: 'CAPTCHA expiré ou invalide' });
    }

    captcha.attempts++;

    if (captcha.attempts > 3) {
        captchaStore.delete(captchaId);
        return res.json({ valid: false, message: 'Trop de tentatives' });
    }

    if (Date.now() - captcha.timestamp > 300000) {
        captchaStore.delete(captchaId);
        return res.json({ valid: false, message: 'CAPTCHA expiré' });
    }

    const isValid = parseInt(answer) === captcha.answer;

    if (isValid) {
        captchaStore.delete(captchaId);
    }

    res.json({
        valid: isValid,
        message: isValid ? 'Succès' : 'Réponse incorrecte'
    });
};

function cleanupOldCaptchas() {
    const now = Date.now();
    for (const [id, captcha] of captchaStore.entries()) {
        if (now - captcha.timestamp > 300000) {
            captchaStore.delete(id);
        }
    }
}