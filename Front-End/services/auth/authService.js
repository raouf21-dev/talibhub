// Services/authService.js
import { apiClient } from "../../config/apiConfig.js";

class AuthService {
  constructor() {
    try {
      // ✅ NOUVELLE LOGIQUE UNIFIÉE : Uniquement cookies, suppression localStorage

      // Nettoyer localStorage existant si présent (migration automatique)
      const existingToken = localStorage.getItem("token");
      if (existingToken) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("tokenExpiry");
        console.log("✅ localStorage nettoyé - Migration vers cookies");
      }

      // Plus de gestion _token interne
      this._token = null;
      this._authCheckInterval = null;

      // Initialiser la vérification périodique seulement si authentifié via cookies
      if (this.isAuthenticated()) {
        this.initAuthCheck();
      }
    } catch (error) {
      console.error("❌ ERREUR dans constructor AuthService:", error);
      throw error;
    }
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
    try {
      // ✅ CORRECTION : Utiliser seulement apiClient sans override
      const response = await apiClient.post("/auth/login", { email, password });

      // ✅ NOUVELLE LOGIQUE : Plus de gestion token, les cookies sont automatiquement définis
      if (response?.success) {
        this.initAuthCheck();
        window.dispatchEvent(new Event("login"));
        return response;
      } else {
        throw new Error("Authentification échouée");
      }
    } catch (error) {
      console.error("Erreur dans authService.login:", error);
      this.handleAuthError(error);
      throw error;
    }
  }

  async register(userData) {
    try {
      // ✅ CORRECTION : Utiliser seulement apiClient
      const response = await apiClient.post("/auth/register", userData);

      // ✅ NOUVELLE LOGIQUE : Plus de gestion token, les cookies sont automatiquement définis
      if (response?.success) {
        this.initAuthCheck();
        return response;
      } else {
        throw new Error("Inscription échouée");
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      this.handleAuthError(error);
      throw error;
    }
  }

  async checkAuth() {
    try {
      // ✅ CORRECTION : Utiliser seulement apiClient
      const response = await apiClient.get("/auth/verify");

      const isAuthenticated = response?.success || false;
      return isAuthenticated;
    } catch (error) {
      console.warn(
        "⚠️ Erreur lors de la vérification de l'authentification:",
        error
      );

      // Si erreur 401/403, effacer les cookies côté client
      if (error.message?.includes("401") || error.message?.includes("403")) {
        this.clearAuth();
      }
      return false;
    }
  }

  async logout() {
    try {
      // ✅ CORRECTION : Utiliser seulement apiClient
      await apiClient.post("/auth/logout", {});
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    } finally {
      this.clearAuth();
    }
  }

  isAuthenticated() {
    // ✅ NOUVELLE LOGIQUE : Uniquement via cookies
    return this.hasAuthCookie();
  }

  getToken() {
    // ✅ NOUVELLE LOGIQUE : Plus de gestion token interne, tout via cookies
    console.log("⚠️ getToken() obsolète - Utilisation automatique des cookies");
    return null;
  }

  async getProfile() {
    try {
      // ✅ CORRECTION : Utiliser seulement apiClient
      const response = await apiClient.get("/auth/profile");
      return response;
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du profil:", error);

      // Ne pas appeler handleAuthError pour OAuth car cela cause des boucles
      if (error.message?.includes("401")) {
        console.log("⚠️ Erreur 401 - Cookie probablement expiré ou invalide");
      }

      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      // ✅ CORRECTION : Utiliser seulement apiClient
      const response = await apiClient.put("/auth/profile", profileData);
      return response;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      this.handleAuthError(error);
      throw error;
    }
  }

  async requestPasswordReset(email) {
    try {
      // ✅ CORRECTION : Utiliser seulement apiClient
      return await apiClient.post("/auth/request-reset", { email });
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation:", error);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      // ✅ CORRECTION : Utiliser seulement apiClient
      return await apiClient.post("/auth/reset-password", {
        token,
        newPassword,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la réinitialisation du mot de passe:",
        error
      );
      throw error;
    }
  }

  hasAuthCookie() {
    // Vérifier le cookie 'auth=true' qui est accessible via JavaScript
    const cookies = document.cookie.split(";");
    const hasAuthTrue = cookies.some((cookie) =>
      cookie.trim().startsWith("auth=true")
    );

    return hasAuthTrue;
  }

  clearAuth() {
    // ✅ NOUVELLE LOGIQUE : Plus de _token interne, plus de localStorage
    this._token = null;

    // Effacer les cookies côté client (best effort)
    document.cookie =
      "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    if (this._authCheckInterval) {
      clearInterval(this._authCheckInterval);
      this._authCheckInterval = null;
    }
  }

  handleAuthError(error) {
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
      // ✅ CORRECTION : Utiliser seulement apiClient
      const response = await apiClient.post("/auth/refresh", {});

      // ✅ NOUVELLE LOGIQUE : Plus de gestion localStorage
      if (response?.success) {
        console.log("✅ Token rafraîchi via cookies");
        return response;
      } else {
        throw new Error("Rafraîchissement échoué");
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du token:", error);
      // Plus de localStorage à nettoyer
      window.dispatchEvent(new Event("logout"));
      throw error;
    }
  }
}

// Export d'une instance unique du service
export const authService = new AuthService();

// 🔥 CRITIQUE: Rendre authService disponible globalement pour éviter les problèmes d'import
window.authService = authService;
