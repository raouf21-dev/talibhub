// middlewares/authenticateToken.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  console.log("🔍 authenticateToken - Vérification token unifié");
  console.log("🌍 NODE_ENV:", process.env.NODE_ENV);
  console.log("🔗 URL demandée:", req.url);
  console.log("🏠 Host:", req.get("host"));
  console.log("🍪 Cookies reçus:", req.cookies);
  console.log("🔐 Cookies signés:", req.signedCookies);

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
    console.log("⚠️ FALLBACK: Utilisation Bearer header (dev uniquement)");
  }

  console.log(
    `🎯 Token final via ${authMethod}:`,
    token ? token.substring(0, 20) + "..." : "❌ AUCUN TOKEN"
  );

  if (!token) {
    console.log("❌ Échec authentification - Aucun token trouvé");
    console.log("📊 Debug complet:", {
      cookies: Object.keys(req.cookies || {}),
      signedCookies: Object.keys(req.signedCookies || {}),
      hasAuthHeader: !!req.headers.authorization,
      userAgent: req.get("User-Agent")?.substring(0, 50),
    });

    return res.status(401).json({
      success: false,
      message: "Aucun token trouvé. Veuillez vous connecter.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ Token ${authMethod} VALIDE pour utilisateur:`, decoded.id);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("❌ Token INVALIDE:", err.message);
    console.log("🔍 Token corrompu:", token?.substring(0, 50));

    return res.status(403).json({
      success: false,
      message: "Token invalide ou expiré. Veuillez vous reconnecter.",
    });
  }
};

module.exports = { authenticateToken };
