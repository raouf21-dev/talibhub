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

// Fonction utilitaire pour obtenir le timestamp de minuit
const getMidnightTimestamp = () => {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
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

  // Nouvelle méthode pour stocker les horaires de mosquée jusqu'à minuit
  setMosqueTimesData(res, city, data) {
    const options = {
      ...getCookieOptions(),
      httpOnly: false, // Permettre l'accès depuis JavaScript
      signed: false, // Pas besoin de signature pour ces données
      maxAge: getMidnightTimestamp() - Date.now(), // Expire à minuit
    };

    // Normaliser le nom de la ville pour l'utiliser comme clé
    const normalizedCity = encodeURIComponent(city.trim().toLowerCase());

    // Récupérer les données existantes s'il y en a
    const cookieName = `mosque_times_data`;
    let existingData = {};

    try {
      if (req.cookies[cookieName]) {
        existingData = JSON.parse(req.cookies[cookieName]);
      }
    } catch (error) {
      console.error("Erreur lors de la lecture des données existantes:", error);
    }

    // Ajouter/remplacer les données pour cette ville
    existingData[normalizedCity] = {
      date: new Date().toISOString().split("T")[0], // Date au format YYYY-MM-DD
      data,
      timestamp: Date.now(),
    };

    // Enregistrer dans le cookie
    res.cookie(cookieName, JSON.stringify(existingData), options);

    // Également sauvegarder dans localStorage côté client
    res.setPublicCookie("mosque_times_backup", JSON.stringify(existingData));
  },

  // Méthode pour récupérer les données d'horaires de mosquée
  getMosqueTimesData(req, city) {
    try {
      const cookieName = `mosque_times_data`;
      const allData = req.cookies[cookieName]
        ? JSON.parse(req.cookies[cookieName])
        : {};

      // Si aucune ville n'est spécifiée, retourner toutes les données
      if (!city) return allData;

      // Normaliser le nom de la ville
      const normalizedCity = encodeURIComponent(city.trim().toLowerCase());

      // Vérifier si les données pour cette ville existent et sont valides (même jour)
      const cityData = allData[normalizedCity];
      if (cityData) {
        const currentDate = new Date().toISOString().split("T")[0];
        if (cityData.date === currentDate) {
          return cityData.data;
        }
      }

      // Pas de données valides trouvées
      return null;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données de mosquée:",
        error
      );
      return null;
    }
  },

  clearMosqueTimesData(res) {
    const options = getCookieOptions();
    res.clearCookie("mosque_times_data", {
      ...options,
      httpOnly: false,
      signed: false,
    });
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
  getMidnightTimestamp, // Exporter cette fonction pour pouvoir l'utiliser ailleurs
};
