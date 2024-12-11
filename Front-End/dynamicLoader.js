// dynamicLoader.js
class Loader {
    constructor(size = 50, thickness = 4) {
        this.size = size;
        this.thickness = thickness;
        this.createStyles();
        this.createLoader();
        this.activeRequests = 0;
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
                    background-color: rgba(255, 255, 255, 0.2);
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
        this.activeRequests++;
        this.container.style.display = 'flex';
    }

    hide() {
        this.activeRequests--;
        if (this.activeRequests <= 0) {
            this.activeRequests = 0;
            this.container.style.display = 'none';
        }
    }
}

// Instance unique du loader
const loader = new Loader();

// Service API
class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('token');
    }

    updateToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...(options.headers || {})
            }
        };

        try {
            loader.show();
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        } finally {
            loader.hide();
        }
    }

    async get(endpoint) {
        return this.request(endpoint);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

// Exporter une instance unique
export const api = new ApiService();