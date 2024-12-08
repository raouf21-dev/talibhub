// apiConfig.js

import { ENV } from './constants.js';

export const langConfig = {
    DEFAULT_LANG: 'fr',
    SUPPORTED_LANGS: ['fr', 'en'],
    HTML_FILES: {
        fr: 'index-fr.html',
        en: 'index-en.html'
    },
    getUserLanguage() {
        const savedLang = localStorage.getItem('userLang');
        if (savedLang && this.SUPPORTED_LANGS.includes(savedLang)) {
            return savedLang;
        }
        const browserLang = navigator.language.split('-')[0];
        return this.SUPPORTED_LANGS.includes(browserLang) ? browserLang : this.DEFAULT_LANG;
    }
};
 
const API_ROUTES = {
    [ENV.DEV]: '/api',
    [ENV.PROD]: '/api',
    [ENV.TEST]: '/api'
};

const getEnvironment = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return ENV.DEV;
    }
    return ENV.PROD;
};

const getBaseUrl = () => {
    const env = getEnvironment();
    const baseUrl = window.location.origin;
    return `${baseUrl}${API_ROUTES[env]}`;
};

export const API_CONFIG = {
    baseUrl: getBaseUrl(),
    endpoints: {
        auth: {
            login: '/auth/login',
            register: '/auth/register',
            verify: '/auth/verify', 
            profile: '/auth/profile',
            updateProfile: '/auth/updateProfile',
            changePassword: '/auth/changePassword'
        },
        tasks: {
            getAll: '/tasks/getAllTasks',
            add: '/tasks/addTask',
            update: '/tasks/updateTask/:id',
            delete: '/tasks/deleteTask/:id'
        },
        timer: {
            updateSession: '/timer/updateSession',
            getSession: '/timer/getSession/:id'
        },
        counter: {
            update: '/counter/update/:id',
            get: '/counter/get/:id'
        },
        session: {
            save: '/session/save', 
            getLast: '/session/last/:taskId'
        },
        surahMemorization: {
            getSurahs: '/surah-memorization/surahs',
            updateSurah: '/surah-memorization/surahs/:id',
            getKnown: '/surah-memorization/known',
            getHistory: '/surah-memorization/history'
        },
        mosqueTime: {
            exists: '/mosque-times/exists/:date',
            scrapeAll: '/mosque-times/scrape-all',
            getCities: '/mosque-times/cities/search',
            getMosques: '/mosque-times/cities/:city/mosques',
            getPrayerTimes: '/mosque-times/:mosqueId/:date'
        },
        sourates: {
            getAll: '/sourates',
            getKnown: '/sourates/known',
            getByNumbers: '/sourates/by-numbers',
            getRecitationStats: '/sourates/recitations/stats',
            saveRecitation: '/sourates/recitations'
        },
        captcha: {
            generate: '/captcha/generate',
            verify: '/captcha/verify'
        },
        data: {
            countries: (lang) => `/data/countries_${lang}.json`
        },
    },
    version: 'v1'
 };

 export const apiClient = {
    async request(endpoint, options = {}) {
        const url = new URL(`${API_CONFIG.baseUrl}${endpoint}`);
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    
        const token = localStorage.getItem('token');
        // Ne pas ajouter le header Authorization si pas de token
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else if (endpoint === API_CONFIG.endpoints.auth.verify) {
            // Si c'est une vérification d'auth sans token, retourner directement false
            return { success: false };
        }
    
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers,
                },
                credentials: 'include',
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || 'Une erreur est survenue');
            }
    
            return data;
        } catch (error) {
            console.error(`Erreur API (${endpoint}):`, error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint);
    },

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    },
};