// utils/logger.js - Système de logs optimisé par niveaux

const LOG_LEVEL = process.env.LOG_LEVEL || "INFO"; // DEBUG, INFO, WARN, ERROR, SILENT

// Définition des niveaux de log avec priorités
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
};

// Niveau actuel configuré
const CURRENT_LEVEL = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.INFO;

class Logger {
  constructor(context = "") {
    this.context = context;
  }

  // Formater le message avec contexte et timestamp
  format(level, message, data = null) {
    const timestamp = new Date().toISOString().split("T")[1].substring(0, 8);
    const contextStr = this.context ? `[${this.context}] ` : "";
    const dataStr = data ? ` | ${JSON.stringify(data)}` : "";

    return `${timestamp} ${level} ${contextStr}${message}${dataStr}`;
  }

  // Log niveau DEBUG (développement seulement)
  debug(message, data = null) {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG) {
      console.log(this.format("🔧 DEBUG", message, data));
    }
  }

  // Log niveau INFO (informations importantes)
  info(message, data = null) {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO) {
      console.log(this.format("ℹ️  INFO", message, data));
    }
  }

  // Log niveau WARN (avertissements)
  warn(message, data = null) {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN) {
      console.warn(this.format("⚠️  WARN", message, data));
    }
  }

  // Log niveau ERROR (erreurs critiques)
  error(message, data = null) {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR) {
      console.error(this.format("❌ ERROR", message, data));
    }
  }

  // Logs spécialisés pour le scraping
  scraping = {
    start: (mosqueName, mosqueId) => {
      this.info(`🚀 Démarrage scraping: ${mosqueName} (ID: ${mosqueId})`);
    },

    success: (mosqueName, duration) => {
      this.info(`✅ Succès: ${mosqueName} en ${duration}ms`);
    },

    retry: (mosqueName, attempt, maxAttempts) => {
      this.warn(`🔄 Tentative ${attempt}/${maxAttempts}: ${mosqueName}`);
    },

    fallback: (mosqueName, strategy) => {
      this.warn(`🔄 Fallback activé: ${mosqueName} → ${strategy}`);
    },

    error: (mosqueName, error) => {
      this.error(`❌ Échec: ${mosqueName}`, { error: error.message });
    },
  };

  // Logs pour la gestion des navigateurs
  browser = {
    create: (poolSize) => {
      this.debug(`🌐 Création navigateur (Pool: ${poolSize})`);
    },

    reuse: (poolSize) => {
      this.debug(`♻️  Réutilisation navigateur (Pool: ${poolSize})`);
    },

    release: (poolSize) => {
      this.debug(`🔄 Libération navigateur (Pool: ${poolSize})`);
    },

    cleanup: (closed) => {
      this.info(`🧹 Nettoyage pool: ${closed} navigateurs fermés`);
    },
  };

  // Logs pour les performances
  performance = {
    batchStart: (batchNumber, totalBatches, batchSize) => {
      this.info(
        `📦 Lot ${batchNumber}/${totalBatches} (${batchSize} mosquées)`
      );
    },

    batchComplete: (batchNumber, successes, errors, duration) => {
      this.info(
        `✅ Lot ${batchNumber} terminé: ${successes} succès, ${errors} erreurs (${Math.round(
          duration / 1000
        )}s)`
      );
    },

    globalComplete: (totalMosques, successes, errors, duration) => {
      this.info(
        `🎯 Scraping global terminé: ${successes}/${totalMosques} succès en ${Math.round(
          duration / 1000
        )}s`
      );
    },
  };
}

// Instance par défaut
const defaultLogger = new Logger();

// Factory pour créer des loggers avec contexte
const createLogger = (context) => new Logger(context);

// Fonctions de compatibilité avec l'ancien système
const log = {
  debug: defaultLogger.debug.bind(defaultLogger),
  info: defaultLogger.info.bind(defaultLogger),
  warn: defaultLogger.warn.bind(defaultLogger),
  error: defaultLogger.error.bind(defaultLogger),
};

module.exports = {
  Logger,
  createLogger,
  log,
  defaultLogger,
  LOG_LEVEL,
  CURRENT_LEVEL,
};
