class CaptchaHandler {
  constructor() {
    this.currentCaptchaId = null;
    this.initialize();
  }

  initialize() {
    this.refreshButton = document.querySelector(".captcha-refresh-btn");
    this.captchaInput = document.getElementById("captchaAnswer");
    this.messageElement = document.getElementById("captchaMessage");

    // Simplification de la validation pour n'autoriser que les chiffres
    if (this.captchaInput) {
      // Bloc les lettres lors de la saisie
      this.captchaInput.addEventListener("keypress", (event) => {
        if (/[a-zA-Z]/.test(event.key)) {
          event.preventDefault();
          return false;
        }
      });

      // Nettoyage supplémentaire pour enlever les lettres si collées
      this.captchaInput.addEventListener("paste", (event) => {
        event.preventDefault();
        const pastedText = (
          event.clipboardData || window.clipboardData
        ).getData("text");
        const cleanValue = pastedText.replace(/[a-zA-Z]/g, "");
        this.captchaInput.value = cleanValue;
      });
    }

    if (this.refreshButton) {
      this.refreshButton.addEventListener("click", () => this.refreshCaptcha());
    }

    document
      .querySelector('[data-tab="signup"]')
      ?.addEventListener("click", () => {
        this.refreshCaptcha();
      });

    if (
      document
        .getElementById("welcomepage-signupTab")
        ?.classList.contains("active")
    ) {
      this.refreshCaptcha();
    }
  }

  async refreshCaptcha() {
    try {
      const response = await fetch("/api/captcha/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok)
        throw new Error("Erreur lors de la génération du CAPTCHA");

      const data = await response.json();

      document.getElementById("captchaProblem").textContent = data.problem;
      document.getElementById("captchaId").value = data.captchaId;
      this.captchaInput.value = "";
      this.messageElement.textContent = "";
      this.messageElement.className = "captcha-message";
      this.currentCaptchaId = data.captchaId;
    } catch (error) {
      console.error("Erreur:", error);
      this.messageElement.textContent = "Erreur de chargement du CAPTCHA";
      this.messageElement.className = "captcha-message error";
    }
  }

  async verify() {
    const answer = this.captchaInput.value;
    const captchaId = document.getElementById("captchaId").value;

    try {
      const response = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ captchaId, answer }),
      });

      const result = await response.json();

      this.messageElement.textContent = result.message;
      this.messageElement.className = `captcha-message ${
        result.valid ? "success" : "error"
      }`;

      if (
        !result.valid &&
        (result.message === "CAPTCHA expiré ou invalide" ||
          result.message === "Trop de tentatives")
      ) {
        this.refreshCaptcha();
      }

      return result.valid;
    } catch (error) {
      console.error("Erreur:", error);
      this.messageElement.textContent = "Erreur de vérification";
      this.messageElement.className = "captcha-message error";
      return false;
    }
  }
}

export default CaptchaHandler;
