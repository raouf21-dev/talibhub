class TurnstileHandler {
  constructor() {
    this.siteKey = null; // Sera récupérée depuis le backend
    this.loaded = false;
    this.widgetId = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Récupérer la Site Key depuis le backend
      await this.loadSiteKey();

      // Charger le script Turnstile
      if (!window.turnstile) {
        await this.loadTurnstileScript();
      }
      this.loaded = true;
      this.renderTurnstile();
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Turnstile:", error);
      throw error;
    }
  }

  async loadSiteKey() {
    try {
      const response = await fetch("/api/turnstile/site-key");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.siteKey) {
        this.siteKey = data.siteKey;
      } else {
        throw new Error(
          "Site Key non disponible: " + (data.message || "Erreur inconnue")
        );
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la Site Key:", error);
      throw new Error(
        "Impossible de charger la configuration Turnstile: " + error.message
      );
    }
  }

  loadTurnstileScript() {
    return new Promise((resolve, reject) => {
      if (document.querySelector("#turnstile-script")) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.id = "turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  renderTurnstile() {
    const container = document.getElementById("turnstile-container");
    if (!container || !window.turnstile || !this.siteKey) {
      console.warn("Conditions manquantes pour rendre Turnstile:", {
        container: !!container,
        turnstile: !!window.turnstile,
        siteKey: !!this.siteKey,
      });
      return;
    }

    // Nettoyer le container s'il existe déjà un widget
    container.innerHTML = "";

    try {
      this.widgetId = window.turnstile.render(container, {
        sitekey: this.siteKey,
        theme: "auto", // 'light', 'dark', ou 'auto'
        size: "normal", // 'normal' ou 'compact'
        callback: this.onSuccess.bind(this),
        "error-callback": this.onError.bind(this),
        "expired-callback": this.onExpired.bind(this),
        "timeout-callback": this.onTimeout.bind(this),
      });

      console.log("Widget Turnstile rendu avec succès, ID:", this.widgetId);
    } catch (error) {
      console.error("Erreur lors du rendu de Turnstile:", error);
    }
  }

  onSuccess(token) {
    console.log("Turnstile résolu avec succès");
    // Émettre un événement pour notifier le succès
    document.dispatchEvent(
      new CustomEvent("turnstile-success", {
        detail: { token },
      })
    );
  }

  onError() {
    console.error("Erreur Turnstile");
    document.dispatchEvent(new CustomEvent("turnstile-error"));
  }

  onExpired() {
    console.log("Turnstile expiré");
    this.reset();
    document.dispatchEvent(new CustomEvent("turnstile-expired"));
  }

  onTimeout() {
    console.log("Turnstile timeout");
    this.reset();
    document.dispatchEvent(new CustomEvent("turnstile-timeout"));
  }

  getToken() {
    if (this.widgetId !== null && window.turnstile) {
      return window.turnstile.getResponse(this.widgetId);
    }
    return null;
  }

  reset() {
    if (this.widgetId !== null && window.turnstile) {
      window.turnstile.reset(this.widgetId);
    }
  }

  remove() {
    if (this.widgetId !== null && window.turnstile) {
      window.turnstile.remove(this.widgetId);
      this.widgetId = null;
    }
  }

  async verify() {
    try {
      const token = this.getToken();
      if (!token) {
        console.warn("Aucun token Turnstile disponible");
        return false;
      }

      const response = await fetch("/api/turnstile/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Erreur vérification Turnstile:", error);
      return false;
    }
  }

  // Méthode pour re-render si nécessaire
  async refresh() {
    this.remove();
    await this.initialize();
  }
}

export default TurnstileHandler;
