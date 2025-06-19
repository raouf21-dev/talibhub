// config/apiConfig.js
import { ENV } from "./constants.js";

export const langConfig = {
  DEFAULT_LANG: "fr",
  SUPPORTED_LANGS: ["fr", "en"],
  HTML_FILES: {
    fr: "index.html",
    en: "index.html",
  },
  getUserLanguage() {
    const savedLang = localStorage.getItem("userLang");
    if (savedLang && this.SUPPORTED_LANGS.includes(savedLang)) {
      return savedLang;
    }
    const browserLang = navigator.language.split("-")[0];
    return this.SUPPORTED_LANGS.includes(browserLang)
      ? browserLang
      : this.DEFAULT_LANG;
  },
};

const API_ROUTES = {
  [ENV.DEV]: "/api",
  [ENV.PROD]: "/api",
  [ENV.TEST]: "/api",
};

const getEnvironment = () => {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return ENV.DEV;
  }
  return ENV.PROD;
};

export const API_BASE_URL = (() => {
  const env = getEnvironment();

  if (env === ENV.PROD) {
    return "https://www.talibhub.com/api";
  } else {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      return `http://localhost:4000${API_ROUTES[env]}`;
    }
    return `${window.location.origin}${API_ROUTES[env]}`;
  }
})();

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  endpoints: {
    auth: {
      login: "/auth/login",
      register: "/auth/register",
      verify: "/auth/verify",
      profile: "/auth/profile",
      updateProfile: "/auth/updateProfile",
      changePassword: "/auth/changePassword",
      refresh: "/auth/refresh",
      logout: "/auth/logout",
    },
    tasks: {
      getAll: "/tasks/getAllTasks",
      add: "/tasks/addTask",
      update: "/tasks/updateTask/:id",
      delete: "/tasks/deleteTask/:id",
    },
    timer: {
      updateSession: "/timer/updateSession",
      getSession: "/timer/getSession/:id",
    },
    counter: {
      update: "/counter/update/:id",
      get: "/counter/get/:id",
    },
    session: {
      save: "/session/save",
      getLast: "/session/last/:taskId",
    },
    surahMemorization: {
      getSurahs: "/surah-memorization/surahs",
      updateSurah: "/surah-memorization/surahs/:id",
      getKnown: "/surah-memorization/known",
      getHistory: "/surah-memorization/history",
    },
    mosqueTime: {
      exists: "/mosque-times/exists/:date",
      scrapeAll: "/mosque-times/scrape-all",
      getCities: "/mosque-times/cities/search",
      getMosques: "/mosque-times/cities/:city/mosques",
      getPrayerTimes: "/mosque-times/:mosqueId/:date",
    },
    sourates: {
      getAll: "/sourates",
      getKnown: "/sourates/known",
      getByNumbers: "/sourates/by-numbers",
      getRecitationStats: "/sourates/recitations/stats",
      saveRecitation: "/sourates/recitations",
    },
    data: {
      countries: (lang) => `/data/countries_${lang}.json`,
    },
  },
  version: "v1",
};

export const apiClient = {
  async request(endpoint, options = {}) {
    const url = new URL(`${API_CONFIG.baseUrl}${endpoint}`);

    const defaultOptions = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    console.log(`🌐 API Request: ${options.method || "GET"} ${url.toString()}`);
    console.log(`🔧 Options:`, finalOptions);

    try {
      const response = await fetch(url, finalOptions);

      console.log(
        `📡 Response Status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData = null;

        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } else {
            errorMessage = (await response.text()) || errorMessage;
          }
        } catch (parseError) {
          console.warn(
            "⚠️ Impossible de parser l'erreur du serveur:",
            parseError
          );
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusText = response.statusText;
        error.data = errorData;

        console.error(`❌ API Error (${endpoint}):`, error);
        throw error;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log(`✅ API Success (${endpoint}):`, data);
        return data;
      } else {
        console.log(`✅ API Success (${endpoint}): Non-JSON response`);
        return { success: true };
      }
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        console.error(`🌐 Network Error (${endpoint}):`, error.message);
        const networkError = new Error("Erreur de connexion réseau");
        networkError.originalError = error;
        networkError.isNetworkError = true;
        throw networkError;
      }

      throw error;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  },

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  },
};

if (getEnvironment() === ENV.DEV) {
  console.log("🔧 API Configuration Debug:", {
    environment: getEnvironment(),
    baseUrl: API_BASE_URL,
    hostname: window.location.hostname,
    origin: window.location.origin,
  });
}
