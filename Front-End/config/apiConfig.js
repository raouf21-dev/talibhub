// config/apiConfig.js
import { ENV } from './constants.js'

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
    baseUrl: (() => {
        const env = getEnvironment();
        if (env === ENV.PROD) {
            return 'https://www.talibhub.com/api';  // Toujours utiliser www en production
        } else {
            return `${window.location.origin}${API_ROUTES[env]}`;
        }
    })(),
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      verify: '/auth/verify',
      profile: '/auth/profile',
      updateProfile: '/auth/updateProfile',
      changePassword: '/auth/changePassword',
      refresh: '/auth/refresh'
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
    }
  },
  version: 'v1'
};

export const apiClient = {
    async request(endpoint, options = {}) {
        const url = new URL(`${API_CONFIG.baseUrl}${endpoint}`);
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const token = localStorage.getItem('token');
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    },

  get(endpoint) {
    return this.request(endpoint);
  },

  post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
  },

  put(endpoint, data) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
