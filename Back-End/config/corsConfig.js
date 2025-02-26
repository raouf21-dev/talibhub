const allowedOrigins = {
  development: [
    "http://localhost:4000",
    "http://localhost:3000",
    "http://127.0.0.1:4000",
  ],
  production: [
    "https://talibhub.com",
    "https://www.talibhub.com",
    "http://localhost:4000", // Ajout de localhost pour les tests en mode production
    "http://127.0.0.1:4000", // Ajout de l'adresse IP locale pour les tests en mode production
  ],
};

const corsOptions = {
  origin: function (origin, callback) {
    // En développement uniquement - autoriser toutes les origines
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // Permettre les requêtes sans origine (comme Postman) en développement uniquement
    if (!origin && process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // En production - vérifier si l'origine est autorisée
    const allowed = allowedOrigins.production;

    // En production, si pas d'origine, rejeter sauf si c'est une requête interne
    if (!origin && process.env.NODE_ENV !== "development") {
      // On peut autoriser certaines requêtes internes sans origine si nécessaire
      // Par exemple pour les tests automatisés ou les services internes
      // Sinon, rejeter par défaut
      return callback(
        new Error("Requêtes sans origine non autorisées en production")
      );
    }

    if (allowed.includes(origin)) {
      callback(null, origin); // Important : renvoyer l'origine exacte, pas juste true
    } else {
      console.warn(`Origine rejetée par CORS: ${origin}`);
      callback(new Error(`Origine non autorisée: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400,
};

module.exports = corsOptions;
