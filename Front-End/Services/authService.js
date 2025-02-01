// Services/authService.js
import { apiClient, API_CONFIG } from '../Config/apiConfig.js';

class AuthService {
    async login(email, password) {
        try {
            const response = await apiClient.post(API_CONFIG.endpoints.auth.login, {
                email,
                password
            }, {
                credentials: 'include'
            });
            
            if (response.token) {
                localStorage.setItem('token', response.token);
            }
            
            return response;
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await apiClient.post(API_CONFIG.endpoints.auth.register, userData, {
                credentials: 'include'
            });
            
            if (response.token) {
                localStorage.setItem('token', response.token);
            }
            
            return response;
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            throw error;
        }
    }

    async checkAuth() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return false; // Au lieu de throw une erreur
            }
            
            const response = await apiClient.get(API_CONFIG.endpoints.auth.verify);
            return response.success || false;
        } catch (error) {
            console.warn('Erreur lors de la vérification du token:', error);
            return false;
        }
    }

    async logout() {
        try {
            await apiClient.post(API_CONFIG.endpoints.auth.logout, {}, {
                credentials: 'include'
            });
            localStorage.removeItem('token');
            document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            throw error;
        }
    }

    isAuthenticated() {
        return document.cookie.includes('auth=true') || !!localStorage.getItem('token');
    }

    getToken() {
        return localStorage.getItem('token');
    }

    async getProfile() {
        try {
            const response = await apiClient.get(API_CONFIG.endpoints.auth.profile);
            return response;
        } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
            throw error;
        }
    }
}

export const authService = new AuthService();