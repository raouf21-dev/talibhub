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
    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
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
    console.log("[DEBUG] API Request - Début:", {
      endpoint,
      method: options.method || "GET",
      hasToken: !!localStorage.getItem("token"),
      currentPath: window.location.pathname,
    });

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

      // Log spécial pour les appels mosque-times
      if (endpoint.includes("mosque-times")) {
        console.log("[DEBUG] API Request mosque-times - URL complète:", url);
        console.log(
          "[DEBUG] API Request mosque-times - Configuration:",
          config
        );
      }

      const response = await fetch(url, config);

      // Log spécial pour les réponses mosque-times
      if (endpoint.includes("mosque-times")) {
        console.log(
          "[DEBUG] API Response mosque-times - Status:",
          response.status
        );
        console.log(
          "[DEBUG] API Response mosque-times - Headers:",
          Object.fromEntries(response.headers.entries())
        );
      }

      if (response.status === 401) {
        console.warn("[DEBUG] API 401 - Détails complets:", {
          endpoint,
          currentPath: window.location.pathname,
          referrer: document.referrer,
          hasToken: !!localStorage.getItem("token"),
          stack: new Error().stack,
        });

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
        } else {
          console.warn(
            "[DEBUG] API 401 - Redirection évitée pour éviter une boucle"
          );
          throw new Error(
            "Unauthorized but redirection avoided to prevent loop"
          );
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[DEBUG] API Erreur HTTP ${response.status}:`, {
          endpoint,
          errorData,
          headers: Object.fromEntries(response.headers.entries()),
        });
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const responseData = await response.json();

      // Log spécial pour les données de mosque-times
      if (endpoint.includes("mosque-times")) {
        console.log(
          "[DEBUG] API Response mosque-times - Données:",
          endpoint.includes("prayer-times")
            ? {
                ...responseData,
                prayerTimes: responseData.prayerTimes?.length || 0,
              }
            : responseData
        );
      }

      return responseData;
    } catch (error) {
      console.error(`[DEBUG] API Error: ${endpoint}`, error);
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
      console.log(`[DEBUG] API Long Running Request démarré: ${endpoint}`);

      // Démarrer la requête
      const response = await this.request(endpoint, options);
      console.log(`[DEBUG] API Initial Response:`, response);

      // Si le statut est "processing", démarrer le polling
      if (response && response.status === "processing" && response.requestId) {
        console.log(
          `[DEBUG] API Polling démarré pour requestId: ${response.requestId}`
        );

        let pollingAttempts = 0;
        const MAX_POLLING_ATTEMPTS = 30; // Environ 1 minute avec intervalle de 2 secondes

        return new Promise((resolve, reject) => {
          const checkStatus = async () => {
            try {
              pollingAttempts++;
              console.log(
                `[DEBUG] API Polling attempt ${pollingAttempts}/${MAX_POLLING_ATTEMPTS}`
              );

              if (pollingAttempts > MAX_POLLING_ATTEMPTS) {
                console.warn(
                  `[DEBUG] API Polling abandoned after ${MAX_POLLING_ATTEMPTS} attempts`
                );
                resolve({
                  status: "timeout",
                  message:
                    "La requête a pris trop de temps, mais continue en arrière-plan",
                });
                return;
              }

              const statusEndpoint = `/mosque-times/scraping-status/${response.requestId}`;
              console.log(`[DEBUG] API Checking status at: ${statusEndpoint}`);

              const statusResponse = await this.get(statusEndpoint);
              console.log(`[DEBUG] API Status response:`, statusResponse);

              if (statusResponse.status === "completed") {
                console.log(
                  `[DEBUG] API Polling completed successfully after ${pollingAttempts} attempts`
                );
                resolve(statusResponse);
              } else if (statusResponse.status === "failed") {
                console.error(
                  `[DEBUG] API Polling failed after ${pollingAttempts} attempts:`,
                  statusResponse.error
                );
                reject(
                  new Error(statusResponse.error || "Le scraping a échoué")
                );
              } else {
                // Continuer le polling
                console.log(`[DEBUG] API Polling continuing...`);
                setTimeout(checkStatus, statusCheckInterval);
              }
            } catch (error) {
              console.error(
                `[DEBUG] API Polling error on attempt ${pollingAttempts}:`,
                error
              );
              // En cas d'erreur pendant le polling, on continue quand même
              // car le scraping peut continuer en arrière-plan
              if (pollingAttempts > 3) {
                console.warn(
                  `[DEBUG] API Polling continuing despite errors...`
                );
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
      console.log(`[DEBUG] API Request completed directly (no polling)`);
      return response;
    } catch (error) {
      console.error(`[DEBUG] API Long Running Error: ${endpoint}`, error);
      throw error;
    }
  }
}

// Exporter une instance unique
export const api = new ApiService();
