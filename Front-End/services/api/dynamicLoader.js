// dynamicLoader.js
class Loader {
  constructor(size = 50, thickness = 4) {
    this.size = size;
    this.thickness = thickness;
    this.createStyles();
    this.createLoader();
    this.activeRequests = 0;
    this.locked = false;
    this.forceShown = false;
  }

  createStyles() {
    if (!document.getElementById("loader-styles")) {
      const styleSheet = document.createElement("style");
      styleSheet.id = "loader-styles";
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
                    pointer-events: none;
                }
                
                .loader {
                    width: ${this.size}px;
                    height: ${this.size}px;
                    border: ${this.thickness}px solid #f3f3f3;
                    border-top: ${this.thickness}px solid #2196f3;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    pointer-events: auto;
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
    if (!document.querySelector(".loader-container")) {
      this.container = document.createElement("div");
      this.container.className = "loader-container";

      this.loader = document.createElement("div");
      this.loader.className = "loader";

      this.container.appendChild(this.loader);
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector(".loader-container");
      this.loader = this.container.querySelector(".loader");
    }
  }

  show() {
    this.activeRequests++;
    this.container.style.display = "flex";
  }

  hide() {
    this.activeRequests--;
    if (this.activeRequests <= 0 && !this.locked && !this.forceShown) {
      this.activeRequests = 0;
      this.container.style.display = "none";
    }
  }

  forceShow() {
    this.forceShown = true;
    this.container.style.display = "flex";
  }

  releaseForceShow() {
    this.forceShown = false;
    if (this.activeRequests <= 0 && !this.locked) {
      this.container.style.display = "none";
    }
  }

  lock() {
    // Méthode temporairement désactivée
  }

  unlock() {
    this.locked = false;
    if (this.activeRequests <= 0) {
      this.container.style.display = "none";
    }
  }
}

// Instance unique du loader
const loader = new Loader();

// Service API
class ApiService {
  constructor() {
    this.baseUrl = "/api";
    this.token = localStorage.getItem("token");
  }

  updateToken(token) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    // Récupérer le token depuis localStorage
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint}`;

    const config = {
      ...options,
      credentials: "include", // Important pour inclure les cookies
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    };

    try {
      loader.show();

      const response = await fetch(url, config);

      if (response.status === 401) {
        // Éviter une boucle de redirection si on est déjà sur welcomepage
        // ou si on travaille avec des données de mosquée publiques
        if (
          window.location.pathname !== "/welcomepage" &&
          !endpoint.includes("mosque-times/report-missing-data") &&
          !endpoint.includes("mosque-times/exists")
        ) {
          // Rediriger vers welcomepage au lieu de login
          window.location.href = "/welcomepage";
          return;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // throw new Error(
        //   errorData.message || `HTTP error! status: ${response.status}`
        // );
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      // Erreur lors de la requête API
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
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  // Méthode pour les requêtes longues avec polling
  async longRunningRequest(endpoint, options = {}, statusCheckInterval = 2000) {
    try {
      // Démarrer la requête
      const response = await this.request(endpoint, options);

      // Si le statut est "processing", démarrer le polling
      if (response && response.status === "processing" && response.requestId) {
        let pollingAttempts = 0;
        const MAX_POLLING_ATTEMPTS = 30; // Environ 1 minute avec intervalle de 2 secondes

        return new Promise((resolve, reject) => {
          const checkStatus = async () => {
            try {
              pollingAttempts++;

              if (pollingAttempts > MAX_POLLING_ATTEMPTS) {
                resolve({
                  status: "timeout",
                  message:
                    "La requête a pris trop de temps, mais continue en arrière-plan",
                });
                return;
              }

              const statusEndpoint = `/mosque-times/scraping-status/${response.requestId}`;
              const statusResponse = await this.get(statusEndpoint);

              if (statusResponse.status === "completed") {
                resolve(statusResponse);
              } else if (statusResponse.status === "failed") {
                reject(
                  new Error(statusResponse.error || "Le scraping a échoué")
                );
              } else {
                // Continuer le polling
                setTimeout(checkStatus, statusCheckInterval);
              }
            } catch (error) {
              // En cas d'erreur pendant le polling, on continue quand même
              // car le scraping peut continuer en arrière-plan
              if (pollingAttempts > 3) {
                setTimeout(checkStatus, statusCheckInterval);
              } else {
                reject(error);
              }
            }
          };

          // Démarrer le polling
          setTimeout(checkStatus, statusCheckInterval);
        });
      }

      // Pour les requêtes normales, retourner directement la réponse
      return response;
    } catch (error) {
      // Erreur lors de la requête longue
      throw error;
    }
  }

  // Nouvelles méthodes pour contrôler le verrouillage du loader
  lockLoader() {
    loader.lock();
    return this;
  }

  unlockLoader() {
    loader.unlock();
    return this;
  }

  // Méthode pour les opérations avec loader verrouillé
  async withLockedLoader(asyncOperation) {
    try {
      this.lockLoader();
      const result = await asyncOperation();
      return result;
    } catch (error) {
      // Erreur pendant l'opération avec loader verrouillé
      throw error;
    } finally {
      this.unlockLoader();
    }
  }

  // Nouvelle version de longRunningRequest qui verrouille le loader
  async longRunningRequestWithLockedLoader(
    endpoint,
    options = {},
    statusCheckInterval = 2000
  ) {
    return this.withLockedLoader(() =>
      this.longRunningRequest(endpoint, options, statusCheckInterval)
    );
  }

  // Méthodes pour contrôler le verrouillage du loader
  lockLoader() {
    loader.lock();
    return this;
  }

  unlockLoader() {
    loader.unlock();
    return this;
  }

  // Nouvelles méthodes pour forcer l'affichage du loader
  forceShowLoader() {
    loader.forceShow();
    return this;
  }

  releaseForceShowLoader() {
    loader.releaseForceShow();
    return this;
  }

  // Méthode pour les opérations avec loader forcé à s'afficher
  async withForcedLoader(asyncOperation) {
    try {
      this.forceShowLoader();
      const result = await asyncOperation();
      return result;
    } catch (error) {
      // Erreur pendant l'opération avec loader forcé
      throw error;
    } finally {
      this.releaseForceShowLoader();
    }
  }

  // Nouvelle version de longRunningRequest qui force l'affichage du loader
  async longRunningRequestWithForcedLoader(
    endpoint,
    options = {},
    statusCheckInterval = 2000
  ) {
    return this.withForcedLoader(() =>
      this.longRunningRequest(endpoint, options, statusCheckInterval)
    );
  }
}

// Exporter une instance unique
export const api = new ApiService();
