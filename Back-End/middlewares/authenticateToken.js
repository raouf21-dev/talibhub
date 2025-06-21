// middlewares/authenticateToken.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  // ✅ PRIORITÉ AUX COOKIES (production avec HTTPS)
  let token = req.cookies?.auth_token || req.signedCookies?.auth_token;
  let authMethod = "cookies";

  // ⚠️ FALLBACK TEMPORAIRE vers Bearer header si pas de cookies
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    authMethod = "bearer";
  }

  if (!token) {
    console.log("❌ Échec authentification - Aucun token trouvé", {
      url: req.url,
      cookies: Object.keys(req.cookies || {}),
      hasAuthHeader: !!req.headers.authorization,
    });

    return res.status(401).json({
      success: false,
      message: "Aucun token trouvé. Veuillez vous connecter.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("❌ Token INVALIDE:", err.message);

    return res.status(403).json({
      success: false,
      message: "Token invalide ou expiré. Veuillez vous reconnecter.",
    });
  }
};

module.exports = { authenticateToken };
