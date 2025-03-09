const getCookieOptions = () => {
  const baseOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
    signed: true, // Activer la signature des cookies
  };

  // En production
  if (process.env.NODE_ENV === "production") {
    return {
      ...baseOptions,
      // Supprimer ou commenter cette ligne pour les tests locaux
      // domain: '.talibhub.com',
      secure: true,
    };
  }

  // En développement
  return {
    ...baseOptions,
    secure: false,
  };
};

const cookieManager = {
  setAuthCookies(res, token) {
    const options = getCookieOptions();

    // Cookie HTTP-only pour le token
    res.cookie("auth_token", token, options);

    // Cookie accessible en JavaScript
    res.cookie("auth", "true", {
      ...options,
      httpOnly: false,
      signed: false, // Pas besoin de signer ce cookie car il ne contient pas de données sensibles
    });
  },

  clearAuthCookies(res) {
    const options = getCookieOptions();
    res.clearCookie("auth_token", options);
    res.clearCookie("auth", { ...options, signed: false });
  },

  getAuthToken(req) {
    // Vérifier d'abord le cookie signé
    const token =
      req.cookies?.auth_token ||
      req.signedCookies?.auth_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization);

    if (!token) {
      console.log("Aucun token trouvé dans:", {
        cookies: req.cookies,
        signedCookies: req.signedCookies,
        authHeader: req.headers.authorization,
      });
    }

    return token;
  },

  setSelectedCity(res, city) {
    const options = {
      ...getCookieOptions(),
      httpOnly: false,
      signed: false,
    };
    res.cookie("selected_city", city, options);
  },

  clearSelectedCity(res) {
    const options = getCookieOptions();
    res.clearCookie("selected_city", options);
  },

  getSelectedCity(req) {
    return req.cookies.selected_city;
  },

  setPublicCookie(res, name, value) {
    const options = {
      ...getCookieOptions(),
      httpOnly: false,
      signed: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
    };
    res.cookie(name, value, options);
  },

  getPublicCookie(req, name) {
    return req.cookies[name];
  },
};

const attachCookieManager = (req, res, next) => {
  res.cookieManager = cookieManager;
  next();
};

module.exports = {
  cookieManager,
  attachCookieManager,
};
