// Services/authService.js
import { apiClient } from '../Config/apiConfig.js';

// Configuration par défaut pour les requêtes
const defaultConfig = {
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

class AuthService {
    constructor() {
        this._token = localStorage.getItem('token');
        this._authCheckInterval = null;
        this.initAuthCheck();
    }

    // Initialise la vérification périodique de l'authentification
    initAuthCheck() {
        if (this._authCheckInterval) {
            clearInterval(this._authCheckInterval);
        }
        // Vérifie l'authentification toutes les 5 minutes
        this._authCheckInterval = setInterval(() => {
            this.checkAuth().catch(console.error);
        }, 5 * 60 * 1000);
    }

    /**
     * Connexion de l'utilisateur
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<Object>}
     */
    async login(email, password) {
        try {
            const response = await apiClient.post('/auth/login', {
                email,
                password
            }, {
                ...defaultConfig,
                withCredentials: true
            });

            if (response?.token) {
                this._token = response.token;
                localStorage.setItem('token', response.token);
                this.initAuthCheck();
                return response;
            }

            throw new Error('Token non reçu dans la réponse');
        } catch (error) {
            console.error('Erreur de connexion:', error);
            this.handleAuthError(error);
            throw error;
        }
    }

    /**
     * Inscription d'un nouvel utilisateur
     * @param {Object} userData - Données d'inscription
     * @returns {Promise<Object>}
     */
    async register(userData) {
        try {
            const response = await apiClient.post('/auth/register', userData, {
                ...defaultConfig,
                withCredentials: true
            });

            if (response?.token) {
                this._token = response.token;
                localStorage.setItem('token', response.token);
                this.initAuthCheck();
                return response;
            }

            throw new Error('Token non reçu dans la réponse');
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            this.handleAuthError(error);
            throw error;
        }
    }

    /**
     * Vérifie si l'utilisateur est authentifié
     * @returns {Promise<boolean>}
     */
    async checkAuth() {
        try {
            if (!this._token && !this.hasAuthCookie()) {
                return false;
            }

            const response = await apiClient.get('/auth/verify', {
                ...defaultConfig,
                headers: {
                    ...defaultConfig.headers,
                    'Authorization': `Bearer ${this._token}`
                }
            });

            return response?.success || false;
        } catch (error) {
            console.warn('Erreur lors de la vérification de l\'authentification:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                this.clearAuth();
            }
            return false;
        }
    }

    /**
     * Déconnexion de l'utilisateur
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await apiClient.post('/auth/logout', {}, {
                ...defaultConfig,
                withCredentials: true
            });
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            this.clearAuth();
        }
    }

    /**
     * Vérifie si l'utilisateur est authentifié
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.hasAuthCookie() || !!this._token;
    }

    /**
     * Récupère le token d'authentification
     * @returns {string|null}
     */
    getToken() {
        return this._token;
    }

    /**
     * Récupère le profil de l'utilisateur
     * @returns {Promise<Object>}
     */
    async getProfile() {
        try {
            const response = await apiClient.get('/auth/profile', {
                ...defaultConfig,
                headers: {
                    ...defaultConfig.headers,
                    'Authorization': `Bearer ${this._token}`
                }
            });
            return response;
        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            this.handleAuthError(error);
            throw error;
        }
    }

    /**
     * Met à jour le profil de l'utilisateur
     * @param {Object} profileData 
     * @returns {Promise<Object>}
     */
    async updateProfile(profileData) {
        try {
            const response = await apiClient.put('/auth/profile', profileData, {
                ...defaultConfig,
                headers: {
                    ...defaultConfig.headers,
                    'Authorization': `Bearer ${this._token}`
                }
            });
            return response;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            this.handleAuthError(error);
            throw error;
        }
    }

    /**
     * Demande de réinitialisation du mot de passe
     * @param {string} email 
     * @returns {Promise<Object>}
     */
    async requestPasswordReset(email) {
        try {
            return await apiClient.post('/auth/request-reset', { email }, defaultConfig);
        } catch (error) {
            console.error('Erreur lors de la demande de réinitialisation:', error);
            throw error;
        }
    }

    /**
     * Réinitialisation du mot de passe
     * @param {string} token 
     * @param {string} newPassword 
     * @returns {Promise<Object>}
     */
    async resetPassword(token, newPassword) {
        try {
            return await apiClient.post('/auth/reset-password', {
                token,
                newPassword
            }, defaultConfig);
        } catch (error) {
            console.error('Erreur lors de la réinitialisation du mot de passe:', error);
            throw error;
        }
    }

    /**
     * Vérifie la présence du cookie d'authentification
     * @returns {boolean}
     */
    hasAuthCookie() {
        return document.cookie.includes('auth=true');
    }

    /**
     * Nettoie les données d'authentification
     */
    clearAuth() {
        this._token = null;
        localStorage.removeItem('token');
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        if (this._authCheckInterval) {
            clearInterval(this._authCheckInterval);
            this._authCheckInterval = null;
        }
    }

    /**
     * Gère les erreurs d'authentification
     * @param {Error} error 
     */
    handleAuthError(error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            this.clearAuth();
            // Vous pouvez également déclencher un événement ici pour informer l'application
            window.dispatchEvent(new CustomEvent('authError', {
                detail: {
                    message: 'Session expirée ou invalide'
                }
            }));
        }
    }
}

// Export d'une instance unique du service
export const authService = new AuthService();