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
    console.log("[LOADER] Initialisation du loader", {
      activeRequests: this.activeRequests,
      locked: this.locked,
      forceShown: this.forceShown,
    });
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
    console.log("[LOADER] createLoader() appelé");
    if (!document.querySelector(".loader-container")) {
      console.log("[LOADER] Création d'un nouveau loader");
      this.container = document.createElement("div");
      this.container.className = "loader-container";

      this.loader = document.createElement("div");
      this.loader.className = "loader";

      this.container.appendChild(this.loader);
      document.body.appendChild(this.container);
      console.log("[LOADER] Nouveau loader créé et ajouté au DOM");
    } else {
      console.log("[LOADER] Utilisation d'un loader existant");
      this.container = document.querySelector(".loader-container");
      this.loader = this.container.querySelector(".loader");
    }
    console.log("[LOADER] État du loader après createLoader():", {
      container: this.container,
      display: this.container.style.display,
      activeRequests: this.activeRequests,
      locked: this.locked,
    });
  }

  show() {
    this.activeRequests++;
    this.container.style.display = "flex";
    //console.log(
    //  `[LOADER] show() appelé - activeRequests: ${this.activeRequests}, locked: ${this.locked}, forceShown: ${this.forceShown}, display: ${this.container.style.display}`
    //);
  }

  hide() {
    this.activeRequests--;
    //console.log(
    //  `[LOADER] hide() appelé - activeRequests: ${this.activeRequests}, locked: ${this.locked}, forceShown: ${this.forceShown}`
    //);
    if (this.activeRequests <= 0 && !this.locked && !this.forceShown) {
      this.activeRequests = 0;
      this.container.style.display = "none";
      console.log("[LOADER] Le loader a été masqué");
    } else {
      console.log(
        `[LOADER] Le loader reste affiché - raison: ${
          this.locked
            ? "verrouillé"
            : this.forceShown
            ? "forcé"
            : "requêtes actives"
        }`
      );
    }
  }

  forceShow() {
      //console.log("[LOADER] forceShow() appelé - état avant:", {
      //activeRequests: this.activeRequests,
      //locked: this.locked,
      //forceShown: this.forceShown,
      //display: this.container.style.display,
    //});
    this.forceShown = true;
    this.container.style.display = "flex";
    console.log("[LOADER] Loader forcé à s'afficher - état après:", {
      activeRequests: this.activeRequests,
      locked: this.locked,
      forceShown: this.forceShown,
      display: this.container.style.display,
    });
  }

  releaseForceShow() {
    console.log("[LOADER] releaseForceShow() appelé - état avant:", {
      activeRequests: this.activeRequests,
      locked: this.locked,
      forceShown: this.forceShown,
      display: this.container.style.display,
    });
    this.forceShown = false;
    if (this.activeRequests <= 0 && !this.locked) {
      this.container.style.display = "none";
      console.log("[LOADER] Loader libéré et masqué - état après:", {
        activeRequests: this.activeRequests,
        locked: this.locked,
        forceShown: this.forceShown,
        display: this.container.style.display,
      });
    } else {
      console.log(
        "[LOADER] Loader libéré mais toujours affiché (requêtes actives ou verrouillé) - état après:",
        {
          activeRequests: this.activeRequests,
          locked: this.locked,
          forceShown: this.forceShown,
          display: this.container.style.display,
        }
      );
    }
  }

  lock() {
    //    console.log("[LOADER] lock() appelé - état avant:", {
      //activeRequests: this.activeRequests,
      //locked: this.locked,
      //display: this.container.style.display,
    //});
    //this.locked = true;
    //this.container.style.display = "flex";
    //console.log("[LOADER] Loader verrouillé (locked) - état après:", {
      //activeRequests: this.activeRequests,
      //locked: this.locked,
      //display: this.container.style.display,
    //});
  }

  unlock() {
    //console.log("[LOADER] unlock() appelé - état avant:", {
      //activeRequests: this.activeRequests,
      //locked: this.locked,
      //display: this.container.style.display,
    //});
    this.locked = false;
    if (this.activeRequests <= 0) {
      this.container.style.display = "none";
      //console.log("[LOADER] Loader déverrouillé et masqué - état après:", {
        //activeRequests: this.activeRequests,
        //locked: this.locked,
        //display: this.container.style.display,
      //});
    } else {
      //console.log(
        //"[LOADER] Loader déverrouillé mais toujours affiché (requêtes actives) - état après:",
        //{
          //activeRequests: this.activeRequests,
          //locked: this.locked,
          //display: this.container.style.display,
        //}
      //);
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
    //console.log("[DEBUG] API Request - Début:", {
      //endpoint,
      //method: options.method || "GET",
      //hasToken: !!localStorage.getItem("token"),
      //currentPath: window.location.pathname,
      //loaderLocked: loader.locked,
      //activeRequests: loader.activeRequests,
    //});

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
        //console.log("[DEBUG] API Request mosque-times - URL complète:", url);
        //console.log(
        //  "[DEBUG] API Request mosque-times - Configuration:",
          //config
        //);
      }

      const response = await fetch(url, config);

      // Log spécial pour les réponses mosque-times
      if (endpoint.includes("mosque-times")) {
        //console.log(
        //  "[DEBUG] API Response mosque-times - Status:",
        //  response.status
        //);
        //console.log(
        //    "[DEBUG] API Response mosque-times - Headers:",
        //  Object.fromEntries(response.headers.entries())
        //);
      }

      if (response.status === 401) {
        //console.warn("[DEBUG] API 401 - Détails complets:", {
          //endpoint,
          //currentPath: window.location.pathname,
          //referrer: document.referrer,
          //hasToken: !!localStorage.getItem("token"),
          //stack: new Error().stack,
        //});

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
          //console.warn(
          //  "[DEBUG] API 401 - Redirection évitée pour éviter une boucle"
          //);
          //throw new Error(
          //  "Unauthorized but redirection avoided to prevent loop"
          //);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        //console.error(`[DEBUG] API Erreur HTTP ${response.status}:`, {
          //endpoint,
          //errorData,
          //headers: Object.fromEntries(response.headers.entries()),
        //});
        //  throw new Error(
        //  errorData.message || `HTTP error! status: ${response.status}`
        //);
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
      console.log(`[API_LONG] Long Running Request démarré: ${endpoint}`, {
        loaderState: {
          locked: loader.locked,
          activeRequests: loader.activeRequests,
        },
      });

      // Démarrer la requête
      console.log(`[API_LONG] Envoi de la requête initiale à ${endpoint}`);
      const response = await this.request(endpoint, options);
      console.log(`[API_LONG] Réponse initiale reçue:`, response, {
        loaderState: {
          locked: loader.locked,
          activeRequests: loader.activeRequests,
        },
      });

      // Si le statut est "processing", démarrer le polling
      if (response && response.status === "processing" && response.requestId) {
        console.log(
          `[API_LONG] Démarrage du polling pour requestId: ${response.requestId}`,
          {
            loaderState: {
              locked: loader.locked,
              activeRequests: loader.activeRequests,
            },
          }
        );

        let pollingAttempts = 0;
        const MAX_POLLING_ATTEMPTS = 30; // Environ 1 minute avec intervalle de 2 secondes

        return new Promise((resolve, reject) => {
          console.log(`[API_LONG] Promise de polling créée`);
          const checkStatus = async () => {
            try {
              pollingAttempts++;
              console.log(
                `[API_LONG] Tentative de polling ${pollingAttempts}/${MAX_POLLING_ATTEMPTS}`,
                {
                  loaderState: {
                    locked: loader.locked,
                    activeRequests: loader.activeRequests,
                  },
                }
              );

              if (pollingAttempts > MAX_POLLING_ATTEMPTS) {
                console.warn(
                  `[API_LONG] Polling abandonné après ${MAX_POLLING_ATTEMPTS} tentatives`,
                  {
                    loaderState: {
                      locked: loader.locked,
                      activeRequests: loader.activeRequests,
                    },
                  }
                );
                resolve({
                  status: "timeout",
                  message:
                    "La requête a pris trop de temps, mais continue en arrière-plan",
                });
                return;
              }

              const statusEndpoint = `/mosque-times/scraping-status/${response.requestId}`;
              console.log(
                `[API_LONG] Vérification du statut à: ${statusEndpoint}`
              );

              console.log(`[API_LONG] Appel GET pour vérifier le statut`);
              const statusResponse = await this.get(statusEndpoint);
              console.log(
                `[API_LONG] Réponse de statut reçue:`,
                statusResponse,
                {
                  loaderState: {
                    locked: loader.locked,
                    activeRequests: loader.activeRequests,
                  },
                }
              );

              if (statusResponse.status === "completed") {
                console.log(
                  `[API_LONG] Polling terminé avec succès après ${pollingAttempts} tentatives`,
                  {
                    loaderState: {
                      locked: loader.locked,
                      activeRequests: loader.activeRequests,
                    },
                  }
                );
                resolve(statusResponse);
              } else if (statusResponse.status === "failed") {
                console.error(
                  `[API_LONG] Polling échoué après ${pollingAttempts} tentatives:`,
                  statusResponse.error,
                  {
                    loaderState: {
                      locked: loader.locked,
                      activeRequests: loader.activeRequests,
                    },
                  }
                );
                reject(
                  new Error(statusResponse.error || "Le scraping a échoué")
                );
              } else {
                // Continuer le polling
                console.log(`[API_LONG] Polling continue...`, {
                  loaderState: {
                    locked: loader.locked,
                    activeRequests: loader.activeRequests,
                  },
                });
                setTimeout(checkStatus, statusCheckInterval);
              }
            } catch (error) {
              console.error(
                `[API_LONG] Erreur lors de la tentative de polling ${pollingAttempts}:`,
                error,
                {
                  loaderState: {
                    locked: loader.locked,
                    activeRequests: loader.activeRequests,
                  },
                }
              );
              // En cas d'erreur pendant le polling, on continue quand même
              // car le scraping peut continuer en arrière-plan
              if (pollingAttempts > 3) {
                console.warn(
                  `[API_LONG] Polling continue malgré les erreurs...`,
                  {
                    loaderState: {
                      locked: loader.locked,
                      activeRequests: loader.activeRequests,
                    },
                  }
                );
                setTimeout(checkStatus, statusCheckInterval);
              } else {
                reject(error);
              }
            }
          };

          // Démarrer le polling
          console.log(
            `[API_LONG] Première vérification de polling planifiée dans ${statusCheckInterval}ms`
          );
          setTimeout(checkStatus, statusCheckInterval);
        });
      }

      // Pour les requêtes normales, retourner directement la réponse
      console.log(`[API_LONG] Requête terminée directement (sans polling)`, {
        loaderState: {
          locked: loader.locked,
          activeRequests: loader.activeRequests,
        },
      });
      return response;
    } catch (error) {
      console.error(
        `[API_LONG] Erreur lors de la requête longue: ${endpoint}`,
        error,
        {
          loaderState: {
            locked: loader.locked,
            activeRequests: loader.activeRequests,
          },
        }
      );
      throw error;
    }
  }

  // Nouvelles méthodes pour contrôler le verrouillage du loader
  lockLoader() {
    console.log("[API] lockLoader() appelé");
    loader.lock();
    return this;
  }

  unlockLoader() {
    console.log("[API] unlockLoader() appelé");
    loader.unlock();
    return this;
  }

  // Méthode pour les opérations avec loader verrouillé
  async withLockedLoader(asyncOperation) {
    console.log(
      "[API] withLockedLoader() - Début de l'opération avec loader verrouillé"
    );
    try {
      this.lockLoader();
      console.log(
        "[API] withLockedLoader() - Loader verrouillé, exécution de l'opération"
      );
      const result = await asyncOperation();
      console.log(
        "[API] withLockedLoader() - Opération terminée avec succès, résultat:",
        result
      );
      return result;
    } catch (error) {
      console.error(
        "[API] withLockedLoader() - Erreur pendant l'opération:",
        error
      );
      throw error;
    } finally {
      console.log(
        "[API] withLockedLoader() - Finally block, déverrouillage du loader"
      );
      this.unlockLoader();
    }
  }

  // Nouvelle version de longRunningRequest qui verrouille le loader
  async longRunningRequestWithLockedLoader(
    endpoint,
    options = {},
    statusCheckInterval = 2000
  ) {
    console.log(
      "[API] longRunningRequestWithLockedLoader() appelé pour:",
      endpoint
    );
    return this.withLockedLoader(() =>
      this.longRunningRequest(endpoint, options, statusCheckInterval)
    );
  }

  // Méthodes pour contrôler le verrouillage du loader
  lockLoader() {
    console.log("[API] lockLoader() appelé");
    loader.lock();
    return this;
  }

  unlockLoader() {
    console.log("[API] unlockLoader() appelé");
    loader.unlock();
    return this;
  }

  // Nouvelles méthodes pour forcer l'affichage du loader
  forceShowLoader() {
    console.log("[API] forceShowLoader() appelé");
    loader.forceShow();
    return this;
  }

  releaseForceShowLoader() {
    console.log("[API] releaseForceShowLoader() appelé");
    loader.releaseForceShow();
    return this;
  }

  // Méthode pour les opérations avec loader forcé à s'afficher
  async withForcedLoader(asyncOperation) {
    console.log(
      "[API] withForcedLoader() - Début de l'opération avec loader forcé"
    );
    try {
      this.forceShowLoader();
      console.log(
        "[API] withForcedLoader() - Loader forcé à s'afficher, exécution de l'opération"
      );
      const result = await asyncOperation();
      console.log(
        "[API] withForcedLoader() - Opération terminée avec succès, résultat:",
        result
      );
      return result;
    } catch (error) {
      console.error(
        "[API] withForcedLoader() - Erreur pendant l'opération:",
        error
      );
      throw error;
    } finally {
      console.log(
        "[API] withForcedLoader() - Finally block, libération du loader"
      );
      this.releaseForceShowLoader();
    }
  }

  // Nouvelle version de longRunningRequest qui force l'affichage du loader
  async longRunningRequestWithForcedLoader(
    endpoint,
    options = {},
    statusCheckInterval = 2000
  ) {
    console.log(
      "[API] longRunningRequestWithForcedLoader() appelé pour:",
      endpoint
    );
    return this.withForcedLoader(() =>
      this.longRunningRequest(endpoint, options, statusCheckInterval)
    );
  }
}

// Exporter une instance unique
export const api = new ApiService();
