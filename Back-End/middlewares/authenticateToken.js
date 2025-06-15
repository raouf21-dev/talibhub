// middlewares/authenticateToken.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  console.log("🔍 authenticateToken - Vérification token");
  console.log("🍪 Cookies disponibles:", req.cookies);
  console.log("🔐 Cookies signés:", req.signedCookies);
  console.log("📋 Headers Authorization:", req.headers.authorization);

  let token = req.cookies?.auth_token;

  // Si pas de cookie, vérifier le header Authorization
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    console.log("🔗 Token extrait du header:", token ? "Présent" : "Absent");
  }

  // Vérifier aussi les cookies signés
  if (!token && req.signedCookies?.auth_token) {
    token = req.signedCookies.auth_token;
    console.log(
      "🔐 Token extrait des cookies signés:",
      token ? "Présent" : "Absent"
    );
  }

  console.log(
    "🎯 Token final utilisé:",
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
    console.log("✅ Token valide pour utilisateur:", decoded.id);
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
