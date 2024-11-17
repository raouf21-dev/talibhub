// captcha.js

class CaptchaHandler {
    constructor() {
        this.currentCaptchaId = null;
        this.initialize();
    }

    initialize() {
        this.refreshButton = document.querySelector('.captcha-refresh-btn');
        this.captchaInput = document.getElementById('captchaAnswer');
        this.messageElement = document.getElementById('captchaMessage');

        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', () => this.refreshCaptcha());
        }

        // Initialiser le CAPTCHA au chargement du formulaire d'inscription
        document.querySelector('[data-tab="signup"]')?.addEventListener('click', () => {
            this.refreshCaptcha();
        });

        // Si le formulaire d'inscription est déjà visible
        if (document.getElementById('welcomepage-signupTab')?.classList.contains('active')) {
            this.refreshCaptcha();
        }
    }

    async refreshCaptcha() {
        try {
            const response = await fetch('/api/captcha/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Erreur lors de la génération du CAPTCHA');

            const data = await response.json();
            
            document.getElementById('captchaProblem').textContent = data.problem;
            document.getElementById('captchaId').value = data.captchaId;
            this.captchaInput.value = '';
            this.messageElement.textContent = '';
            this.messageElement.className = 'captcha-message';
            this.currentCaptchaId = data.captchaId;
        } catch (error) {
            console.error('Erreur:', error);
            this.messageElement.textContent = 'Erreur de chargement du CAPTCHA';
            this.messageElement.className = 'captcha-message error';
        }
    }

    async verify() {
        const answer = this.captchaInput.value;
        const captchaId = document.getElementById('captchaId').value;

        try {
            const response = await fetch('/api/captcha/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ captchaId, answer })
            });

            const result = await response.json();

            this.messageElement.textContent = result.message;
            this.messageElement.className = `captcha-message ${result.valid ? 'success' : 'error'}`;

            if (!result.valid && (result.message === 'CAPTCHA expiré ou invalide' || 
                result.message === 'Trop de tentatives')) {
                this.refreshCaptcha();
            }

            return result.valid;
        } catch (error) {
            console.error('Erreur:', error);
            this.messageElement.textContent = 'Erreur de vérification';
            this.messageElement.className = 'captcha-message error';
            return false;
        }
    }
}

// Ajouter cette ligne à la fin du fichier pour exporter la classe
export default CaptchaHandler;
