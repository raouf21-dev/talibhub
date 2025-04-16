const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const corsOptions = require("./config/corsConfig");
const cookieParser = require("cookie-parser");
const { attachCookieManager } = require("./middlewares/cookieManager");
const fs = require("fs");
const { authenticateToken } = require("./middlewares/authenticateToken");
const authController = require("./controllers/authController");
const mosqueTimesController = require("./controllers/mosqueTimesController");

require("dotenv").config({
  path: path.join(__dirname, `.env.${process.env.NODE_ENV || "development"}`),
});

const app = express();
const isProd = process.env.NODE_ENV === "production";

// Vérifier et configurer le cookie secret
if (!process.env.COOKIE_SECRET) {
  if (isProd) {
    throw new Error("COOKIE_SECRET must be defined in environment variables");
  } else {
    process.env.COOKIE_SECRET =
      "dev_cookie_secret_" + Math.random().toString(36).slice(2);
    console.warn(
      "⚠️  WARNING: Using auto-generated COOKIE_SECRET in development"
    );
  }
}

// Configuration de Helmet - Simplification des directives CSP
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    "https://unpkg.com",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
    "https://www.talibhub.com",
    "http://www.talibhub.com",
    ...(isProd ? [] : ["http://localhost:*"]),
  ],
  fontSrc: [
    "'self'",
    "data:",
    "https://cdnjs.cloudflare.com",
    "https://www.talibhub.com",
    "http://www.talibhub.com",
    ...(isProd ? [] : ["http://localhost:*"]),
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'",
    "https://unpkg.com",
    "https://cdnjs.cloudflare.com",
    "https://www.talibhub.com",
    "http://www.talibhub.com",
  ],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: [
    "'self'",
    "https://api.example.com",
    "https://api.aladhan.com",
    "https://www.talibhub.com",
    "http://www.talibhub.com",
    "https://talibhub.com",
    "http://talibhub.com",
    ...(isProd ? [] : ["http://localhost:*", "ws://localhost:*"]),
  ],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'self'", "https://www.talibhub.com", "http://www.talibhub.com"],
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors(corsOptions));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(attachCookieManager);

app.use(bodyParser.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Logger de développement
if (!isProd) {
  app.use((req, res, next) => {
    const sanitizedBody = { ...req.body };
    ["password", "confirmPassword", "currentPassword", "newPassword"].forEach(
      (field) => {
        if (sanitizedBody[field]) sanitizedBody[field] = "[MASQUÉ]";
      }
    );

    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log("Cookies:", req.cookies);
    if (Object.keys(sanitizedBody).length > 0) {
      console.log("Body:", sanitizedBody);
    }
    next();
  });
}

// Configuration des types MIME pour les fichiers JavaScript
app.use((req, res, next) => {
  if (req.path.endsWith(".js")) {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  }
  next();
});

// Assurez-vous que vos routes statiques sont configurées correctement
app.use("/assets", express.static(path.join(__dirname, "../Front-End/assets")));
app.use("/config", express.static(path.join(__dirname, "../Front-End/config")));
app.use(
  "/services",
  express.static(path.join(__dirname, "../Front-End/services"))
);
app.use(express.static(path.join(__dirname, "../Front-End")));

// Modifier la route pour le favicon
app.get("/favicon.ico", (req, res) => {
  // Vérifier si le fichier existe avant de l'envoyer
  const faviconPath = path.join(__dirname, "../Front-End/favicon.ico");
  if (fs.existsSync(faviconPath)) {
    res.sendFile(faviconPath);
  } else {
    // Envoyer une réponse 204 (No Content) si le fichier n'existe pas
    res.status(204).end();
  }
});

// Import des routes
const authRoutes = require("./routes/authRoutes");
const tasksRoutes = require("./routes/tasksRoutes");
const timerRoutes = require("./routes/timerRoutes");
const counterRoutes = require("./routes/counterRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const sourateRoutes = require("./routes/souratesRoutes");
const statisticsRoutes = require("./routes/statisticsRoutes");
const mosqueTimesRoutes = require("./routes/mosqueTimesRoutes");
const surahMemorizationRoutes = require("./routes/surahMemorizationRoutes");
const captchaRoutes = require("./routes/captchaRoutes");
const duaTimeRoutes = require("./routes/duaTimeRoutes");

// Routes API (après le middleware)
app.use("/api/mosque-times", mosqueTimesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/timer", timerRoutes);
app.use("/api/counter", counterRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/sourates", sourateRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/surah-memorization", surahMemorizationRoutes);
app.use("/api/captcha", captchaRoutes);
app.use("/api/dua-time", duaTimeRoutes);

// Ajouter une route pour stocker les horaires dans les cookies
app.post("/api/cookie/mosque-times", authenticateToken, (req, res) => {
  authController.storeMosqueTimesInCookie(req, res);
});

// Ajouter le middleware cookieManager à la route publique
app.post("/api/public/cookie/mosque-times", attachCookieManager, (req, res) => {
  authController.storePublicMosqueTimesInCookie(req, res);
});

// Routes statiques
app.use("/api/data", express.static(path.join(__dirname, "data")));

// Configuration des langues
const langConfig = {
  DEFAULT_LANG: "fr",
  SUPPORTED_LANGS: ["fr", "en"],
};

// Configuration pour servir les fichiers statiques
app.use("/assets", express.static(path.join(__dirname, "../Front-End/assets")));
app.use(express.static(path.join(__dirname, "../Front-End")));

// Ajouter cette configuration aux middleware statiques
app.use(
  express.static(path.join(__dirname, "../Front-End"), {
    setHeaders: (res, path, stat) => {
      // Définir des en-têtes qui empêchent la mise en cache trop agressive
      if (path.endsWith(".js") || path.endsWith(".css")) {
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader(
          "Content-Type",
          path.endsWith(".js") ? "application/javascript" : "text/css"
        );
      }
    },
  })
);

// Puis plus bas, modifier la route SPA pour qu'elle ne s'applique qu'aux routes non-fichiers
app.get("*", (req, res, next) => {
  // Ne pas traiter les requêtes API
  if (req.url.startsWith("/api")) return next();

  // Ne pas traiter les requêtes pour des fichiers statiques (avec extension)
  if (req.url.includes(".")) return next();

  // Déterminer la langue de l'utilisateur
  const userLang =
    req.acceptsLanguages(langConfig.SUPPORTED_LANGS) || langConfig.DEFAULT_LANG;

  // Envoyer le fichier HTML correspondant
  res.sendFile(path.join(__dirname, `../Front-End/index-${userLang}.html`));
});

app.get("/services/state/state.js", (req, res, next) => {
  // Vérifier si le fichier existe d'abord
  const filePath = path.join(__dirname, "../Front-End/services/state/state.js");
  if (fs.existsSync(filePath)) {
    // Si le fichier existe, on le lit
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return next(); // Passer au middleware suivant en cas d'erreur
      }

      // Ajouter l'export nommé appState
      res.setHeader("Content-Type", "application/javascript");
      res.send(`
        ${data}
        // Ajout de l'export nommé appState
        export const appState = AppState;
      `);
    });
  } else {
    // Si le fichier n'existe pas, passer au middleware suivant
    next();
  }
});

// Initialiser la tâche de nettoyage périodique
mosqueTimesController.initializeCleanupTask();

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error("Erreur:", err);
  const error = isProd
    ? { message: "Une erreur est survenue" }
    : { message: err.message, stack: err.stack };
  res.status(err.status || 500).json({ success: false, error });
});

// Routes non trouvées
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route non trouvée" });
});

module.exports = app;
