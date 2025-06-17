// middlewares/authenticateToken.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  console.log("🔍 authenticateToken - Vérification token unifié");
  console.log("🍪 Cookies disponibles:", req.cookies);
  console.log("🔐 Cookies signés:", req.signedCookies);

  // ✅ NOUVELLE LOGIQUE : Privilégier les cookies
  let token = req.cookies?.auth_token || req.signedCookies?.auth_token;
  let authMethod = "cookies";

  // ⚠️ COMPATIBILITÉ TEMPORAIRE : Fallback vers Bearer (à supprimer plus tard)
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    authMethod = "bearer";
    console.log("⚠️ FALLBACK: Utilisation Bearer (compatibilité temporaire)");
  }

  console.log(
    `🎯 Token obtenu via ${authMethod}:`,
    token ? token.substring(0, 20) + "..." : "Aucun"
  );

  if (!token) {
    console.log("❌ Aucun token trouvé - Rejet 401");
    return res.status(401).json({
      success: false,
      message: "Aucun token trouvé. Veuillez vous connecter.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ Token ${authMethod} valide pour utilisateur:`, decoded.id);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("❌ Token invalide:", err.message);
    return res.status(403).json({
      success: false,
      message: "Token invalide ou expiré. Veuillez vous reconnecter.",
    });
  }
};

module.exports = { authenticateToken };
