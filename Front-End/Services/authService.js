// services/authService.js

import { apiClient, API_CONFIG } from '../Config/apiConfig.js';

export const authService = {
    async login(email, password) {
        try {
            const response = await apiClient.post(API_CONFIG.endpoints.auth.login, {
                email,
                password
            });
            
            if (response.token) {
                localStorage.setItem('token', response.token);
            }
            
            return response;
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        }
    },

    async register(userData) {
        try {
            const response = await apiClient.post(API_CONFIG.endpoints.auth.register, userData);
            
            if (response.token) {
                localStorage.setItem('token', response.token);
            }
            
            return response;
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('token');
        // Autres nettoyages si nécessaire
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    getToken() {
        return localStorage.getItem('token');
    }
};