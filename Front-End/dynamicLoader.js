// dynamicLoader.js

class Loader {
    constructor(size = 50, thickness = 4) {
        this.size = size;
        this.thickness = thickness;
        this.createStyles();
        this.createLoader();
    }

    createStyles() {
        if (!document.getElementById('loader-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'loader-styles';
            styleSheet.textContent = `
                .loader-container {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(255, 255, 255, 0.8);
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                
                .loader {
                    width: ${this.size}px;
                    height: ${this.size}px;
                    border: ${this.thickness}px solid #f3f3f3;
                    border-top: ${this.thickness}px solid #2196f3;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }

    createLoader() {
        // Création du conteneur s'il n'existe pas déjà
        if (!document.querySelector('.loader-container')) {
            this.container = document.createElement('div');
            this.container.className = 'loader-container';
            
            this.loader = document.createElement('div');
            this.loader.className = 'loader';
            
            this.container.appendChild(this.loader);
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.loader-container');
            this.loader = this.container.querySelector('.loader');
        }
    }

    show() {
        this.container.style.display = 'flex';
    }

    hide() {
        this.container.style.display = 'none';
    }

    async withLoading(promise) {
        try {
            this.show();
            const result = await promise;
            return result;
        } finally {
            this.hide();
        }
    }
}