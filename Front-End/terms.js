class TermsHandler {
    constructor() {
        try {
            // Mise à jour des sélecteurs pour correspondre à la structure HTML
            this.termsLink = document.querySelector('.terms-link');
            this.termsCheckbox = document.getElementById('welcomepage-terms');
            this.submitButton = document.querySelector('#welcomepage-signupForm button[type="submit"]');
            this.termsWindow = null;

            if (!this.termsLink || !this.termsCheckbox || !this.submitButton) {
                console.warn('Les éléments des CGU ne sont pas encore chargés dans le DOM');
                document.addEventListener('DOMContentLoaded', () => {
                    this.initializeAfterDOM();
                });
            } else {
                this.initialize();
            }
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de TermsHandler:', error);
        }
    }

    initializeAfterDOM() {
        // Réessayer de récupérer les éléments avec les bons sélecteurs
        this.termsLink = document.querySelector('.terms-link');
        this.termsCheckbox = document.getElementById('welcomepage-terms');
        this.submitButton = document.querySelector('#welcomepage-signupForm button[type="submit"]');

        if (this.validateElements()) {
            this.initialize();
        } else {
            console.error('Les éléments des CGU sont toujours manquants après le chargement du DOM');
        }
    }

    initialize() {
        if (!this.validateElements()) {
            console.error('Certains éléments des CGU sont manquants');
            return;
        }

        // Vérifier l'état initial de la checkbox
        const isChecked = this.termsCheckbox.checked;
        this.submitButton.disabled = !isChecked;
        this.submitButton.classList.toggle('enabled', isChecked);

        this.setupEventListeners();
    }

    validateElements() {
        const missing = [];
        if (!this.termsLink) missing.push('terms-link');
        if (!this.termsCheckbox) missing.push('welcomepage-terms');
        if (!this.submitButton) missing.push('submit button');

        if (missing.length > 0) {
            console.warn(`Éléments manquants: ${missing.join(', ')}`);
            return false;
        }
        return true;
    }

    setupEventListeners() {
        // Gestion du clic sur le lien des CGU
        this.termsLink.addEventListener('click', (e) => this.openTermsWindow(e));

        // Gestion de l'état de la checkbox
        this.termsCheckbox.addEventListener('change', () => this.handleCheckboxChange());

        // Validation avant soumission du formulaire
        const form = document.getElementById('welcomepage-signupForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        } else {
            console.warn('Formulaire d\'inscription non trouvé');
        }
    }

    handleCheckboxChange() {
        const isChecked = this.termsCheckbox.checked;
        this.submitButton.disabled = !isChecked;
        
        // Ajout/suppression de classes pour le style
        if (isChecked) {
            this.submitButton.classList.add('enabled');
            this.submitButton.classList.remove('disabled');
        } else {
            this.submitButton.classList.remove('enabled');
            this.submitButton.classList.add('disabled');
        }
    }

    handleFormSubmit(e) {
        if (!this.isAccepted()) {
            e.preventDefault();
            alert('Veuillez accepter les Conditions Générales d\'Utilisation pour continuer.');
        }
    }

    openTermsWindow(e) {
        e.preventDefault();
        
        // Définir les dimensions et position de la fenêtre
        const width = Math.min(800, window.innerWidth - 40);
        const height = Math.min(600, window.innerHeight - 40);
        const left = (window.innerWidth - width) / 2 + window.screenX;
        const top = (window.innerHeight - height) / 2 + window.screenY;

        // Ouvrir une nouvelle fenêtre avec les CGU
        this.termsWindow = window.open(
            '/terms.html',
            'CGU - BlueticksWeb',
            `width=${width},
             height=${height},
             left=${left},
             top=${top},
             resizable=yes,
             scrollbars=yes,
             status=no,
             location=no,
             toolbar=no,
             menubar=no`
        );

        // Vérifier périodiquement si la fenêtre est fermée
        const checkWindow = setInterval(() => {
            if (this.termsWindow && this.termsWindow.closed) {
                clearInterval(checkWindow);
            }
        }, 1000);
    }

    isAccepted() {
        return this.termsCheckbox?.checked || false;
    }
}

export default TermsHandler;