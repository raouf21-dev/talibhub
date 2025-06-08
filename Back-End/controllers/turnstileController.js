const axios = require("axios");

// Configuration avec support des clés de test pour le développement
const isDevelopment =
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV !== "production";

// Clés de test Cloudflare (toujours valides)
const DEV_TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
const DEV_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";

// Utiliser les clés de test en développement ou les vraies clés en production
const TURNSTILE_SECRET_KEY =
  isDevelopment && !process.env.TURNSTILE_SECRET_KEY
    ? DEV_TURNSTILE_SECRET_KEY
    : process.env.TURNSTILE_SECRET_KEY;

const TURNSTILE_SITE_KEY =
  isDevelopment && !process.env.TURNSTILE_SITE_KEY
    ? DEV_TURNSTILE_SITE_KEY
    : process.env.TURNSTILE_SITE_KEY;

// Log de la configuration au démarrage
if (isDevelopment) {
  console.log("🔧 Turnstile en mode DÉVELOPPEMENT");
  if (!process.env.TURNSTILE_SECRET_KEY || !process.env.TURNSTILE_SITE_KEY) {
    console.log(
      "📝 Utilisation des clés de test Cloudflare (toujours valides)"
    );
  } else {
    console.log("🔑 Utilisation des clés personnalisées depuis .env");
  }
}

exports.verifyTurnstile = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Token Turnstile manquant",
    });
  }

  if (!TURNSTILE_SECRET_KEY) {
    console.error("TURNSTILE_SECRET_KEY non configurée");
    return res.status(500).json({
      success: false,
      message: "Configuration serveur manquante",
    });
  }

  try {
    // Préparer les données pour l'API Turnstile (format URLSearchParams)
    const params = new URLSearchParams();
    params.append("secret", TURNSTILE_SECRET_KEY);
    params.append("response", token);
    params.append("remoteip", req.ip);

    const response = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { success, "error-codes": errorCodes, action, cdata } = response.data;

    // Log pour debug (en développement seulement)
    if (process.env.NODE_ENV !== "production") {
      console.log("Turnstile Response:", {
        success,
        errorCodes,
        action,
        cdata,
        hostname: response.data.hostname,
      });
    }

    if (!success && errorCodes) {
      console.warn("Turnstile verification failed:", errorCodes);
    }

    res.json({
      success,
      action,
      errorCodes,
      message: success ? "Vérification réussie" : "Échec de la vérification",
    });
  } catch (error) {
    console.error("Erreur lors de la vérification Turnstile:", error.message);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la vérification",
    });
  }
};

// Méthode pour obtenir la Site Key (publique)
exports.getTurnstileSiteKey = (req, res) => {
  if (!TURNSTILE_SITE_KEY) {
    return res.status(500).json({
      success: false,
      message: "TURNSTILE_SITE_KEY non configurée",
    });
  }

  res.json({
    success: true,
    siteKey: TURNSTILE_SITE_KEY,
  });
};

// Méthode pour vérifier si Turnstile est configuré
exports.checkTurnstileConfig = (req, res) => {
  const isConfigured = !!(TURNSTILE_SECRET_KEY && TURNSTILE_SITE_KEY);

  res.json({
    configured: isConfigured,
    secretKeyConfigured: !!TURNSTILE_SECRET_KEY,
    siteKeyConfigured: !!TURNSTILE_SITE_KEY,
    message: isConfigured ? "Turnstile configuré" : "Turnstile non configuré",
  });
};
