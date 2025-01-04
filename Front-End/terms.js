// terms.js
class TermsHandler {
    constructor() {
        this.termsLink = document.getElementById('terms-link');
        this.termsCheckbox = document.getElementById('welcomepage-terms');
        this.submitButton = document.querySelector('#welcomepage-signupForm button[type="submit"]');
        this.termsWindow = null;
        
        this.initialize();
    }

    initialize() {
        if (!this.validateElements()) {
            console.error('Certains éléments des CGU sont manquants');
            return;
        }

        // Désactiver le bouton initialement
        this.submitButton.disabled = true;
        this.submitButton.classList.remove('enabled');

        this.setupEventListeners();
    }

    validateElements() {
        return this.termsLink && this.termsCheckbox && this.submitButton;
    }

    setupEventListeners() {
        // Gestion du clic sur le lien des CGU
        this.termsLink.addEventListener('click', (e) => this.openTermsWindow(e));

        // Gestion de l'état de la checkbox
        this.termsCheckbox.addEventListener('change', () => this.handleCheckboxChange());

        // Validation avant soumission du formulaire
        document.getElementById('welcomepage-signupForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    handleCheckboxChange() {
        const isChecked = this.termsCheckbox.checked;
        this.submitButton.disabled = !isChecked;
        this.submitButton.classList.toggle('enabled', isChecked);
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
        const width = 800;
        const height = 600;
        const left = (window.innerWidth - width) / 2 + window.screenX;
        const top = (window.innerHeight - height) / 2 + window.screenY;

        // Ouvrir une nouvelle fenêtre avec les CGU
        this.termsWindow = window.open(
            '/terms.html',  // URL mise à jour pour pointer directement vers le fichier HTML
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

    // Méthode publique pour vérifier si les CGU sont acceptées
    isAccepted() {
        return this.termsCheckbox.checked;
    }
}

// Export de la classe pour l'utiliser dans auth.js
export default TermsHandler;