// Services/authService.js
import { apiClient } from "../../config/apiConfig.js";

const defaultConfig = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

class AuthService {
  constructor() {
    this._token = localStorage.getItem("token");
    this._authCheckInterval = null;
    this.initAuthCheck();
  }

  initAuthCheck() {
    if (this._authCheckInterval) {
      clearInterval(this._authCheckInterval);
    }
    // Vérification de l'authentification toutes les 5 minutes
    this._authCheckInterval = setInterval(() => {
      this.checkAuth().catch(console.error);
    }, 5 * 60 * 1000);
  }

  async login(email, password) {
    console.log("[DEBUG] authService.login appelé");
    try {
      const response = await apiClient.post(
        "/auth/login",
        { email, password },
        {
          ...defaultConfig,
          withCredentials: true,
        }
      );

      if (response?.token) {
        this._token = response.token;
        localStorage.setItem("token", response.token);
        this.initAuthCheck();
        console.log(
          "Authentification réussie, déclenchement de l'événement login"
        );
        window.dispatchEvent(new Event("login"));
        return response;
      }
      throw new Error("Token non reçu dans la réponse");
    } catch (error) {
      console.error("[DEBUG] Erreur dans authService.login:", error);
      console.log("[DEBUG] Stack trace:", new Error().stack);
      this.handleAuthError(error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await apiClient.post("/auth/register", userData, {
        ...defaultConfig,
        withCredentials: true,
      });

      if (response?.token) {
        this._token = response.token;
        localStorage.setItem("token", response.token);
        this.initAuthCheck();
        return response;
      }
      throw new Error("Token non reçu dans la réponse");
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      this.handleAuthError(error);
      throw error;
    }
  }

  async checkAuth() {
    try {
      // Si on a un token en localStorage, l'utiliser (auth classique)
      if (this._token) {
        const response = await apiClient.get("/auth/verify", {
          ...defaultConfig,
          headers: {
            ...defaultConfig.headers,
            Authorization: `Bearer ${this._token}`,
          },
        });
        return response?.success || false;
      }

      // Si on a un cookie auth, vérifier via cookies (OAuth)
      if (this.hasAuthCookie()) {
        console.log("🔍 Vérification auth via cookies (OAuth)");
        const response = await apiClient.get("/auth/verify", {
          ...defaultConfig,
          withCredentials: true,
        });
        return response?.success || false;
      }

      return false;
    } catch (error) {
      console.warn(
        "Erreur lors de la vérification de l'authentification:",
        error
      );
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.clearAuth();
      }
      return false;
    }
  }

  async logout() {
    try {
      await apiClient.post(
        "/auth/logout",
        {},
        {
          ...defaultConfig,
          withCredentials: true,
        }
      );
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      this.clearAuth();
    }
  }

  isAuthenticated() {
    return this.hasAuthCookie() || !!this._token;
  }

  getToken() {
    return this._token;
  }

  async getProfile() {
    try {
      // Pour OAuth avec cookies httpOnly, on n'a pas de token en localStorage
      // Mais les cookies sont automatiquement envoyés avec la requête
      console.log("🔍 Appel getProfile() avec cookies automatiques");
      console.log("🍪 Cookies actuels:", document.cookie);
      console.log("🔧 Configuration requête:", {
        url: "/auth/profile",
        withCredentials: true,
        headers: defaultConfig.headers,
      });

      const response = await apiClient.get("/auth/profile", {
        ...defaultConfig,
        withCredentials: true, // Important pour envoyer les cookies
      });

      console.log("✅ Profil récupéré via API:", response);
      return response;
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du profil:", error);
      console.error("❌ Détails erreur:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });

      // Ne pas appeler handleAuthError pour OAuth car cela cause des boucles
      if (error.response?.status === 401) {
        console.log("⚠️ Erreur 401 - Cookie probablement expiré ou invalide");
      }

      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const response = await apiClient.put("/auth/profile", profileData, {
        ...defaultConfig,
        headers: {
          ...defaultConfig.headers,
          Authorization: `Bearer ${this._token}`,
        },
      });
      return response;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      this.handleAuthError(error);
      throw error;
    }
  }

  async requestPasswordReset(email) {
    try {
      return await apiClient.post(
        "/auth/request-reset",
        { email },
        defaultConfig
      );
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation:", error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      return await apiClient.post(
        "/auth/reset-password",
        { token, newPassword },
        defaultConfig
      );
    } catch (error) {
      console.error(
        "Erreur lors de la réinitialisation du mot de passe:",
        error
      );
      throw error;
    }
  }

  hasAuthCookie() {
    return document.cookie.includes("auth=true");
  }

  clearAuth() {
    console.log("[DEBUG] authService.clearAuth appelé");
    console.log("[DEBUG] Stack trace:", new Error().stack);
    this._token = null;
    localStorage.removeItem("token");
    document.cookie =
      "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    if (this._authCheckInterval) {
      clearInterval(this._authCheckInterval);
      this._authCheckInterval = null;
    }
  }

  handleAuthError(error) {
    console.error("[DEBUG] authService.handleAuthError appelé:", error);
    console.log("[DEBUG] Stack trace:", new Error().stack);
    console.log("[DEBUG] Chemin actuel:", window.location.pathname);

    // Au lieu de rediriger vers /login, rediriger vers /welcomepage
    if (window.location.pathname !== "/welcomepage") {
      console.log(
        "Redirection vers welcomepage suite à une erreur d'authentification"
      );
      window.location.href = "/welcomepage";
    }

    // Déclencher l'événement logout
    window.dispatchEvent(new Event("logout"));
  }

  async refreshToken() {
    try {
      const response = await apiClient.post(
        "/auth/refresh",
        {},
        {
          ...defaultConfig,
          withCredentials: true,
        }
      );
      if (response?.token) {
        this._token = response.token;
        localStorage.setItem("token", response.token);
      }
      return response;
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du token:", error);
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("logout"));
      throw error;
    }
  }
}

// Export d'une instance unique du service
export const authService = new AuthService();
