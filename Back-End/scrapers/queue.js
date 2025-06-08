// scraperQueue.js
const TIMEOUT_DURATION = 45000; // 45 secondes (réduit de 90s)
const RECENT_EXECUTION_TTL = 60000; // 1 minute
const { monitoring } = require("./utils/monitoring");
const universalFallback = require("./utils/universal-fallback");
const { getBrowserPool } = require("./utils/browser-pool");
const { createLogger } = require("./utils/logger");

const logger = createLogger("ScraperQueue");

class ScraperQueue {
  constructor() {
    this.processing = new Map(); // Tâches en cours {id -> Promise}
    this.results = new Map(); // Résultats récents {id -> {result, timestamp}}
    this.retryAttempts = new Map(); // Compteur de tentatives par ID
    this.MAX_RETRIES = 3; // 3 tentatives principales avant fallback

    // Initialiser le pool de navigateurs
    this.browserPool = getBrowserPool(4); // Maximum 4 navigateurs
    this.initializeBrowserPool();

    logger.info("🚀 ScraperQueue initialisé avec pool de navigateurs");
  }

  // Initialiser la configuration du pool de navigateurs
  initializeBrowserPool() {
    // Configuration des navigateurs pour le pool
    const browserConfig = {
      // Options spécifiques si nécessaire
      defaultViewport: { width: 1920, height: 1080 },
    };

    this.browserPool.setBrowserConfig(browserConfig);
  }

  // Vérifier si une tâche est en cours pour un ID
  isProcessing(id) {
    return this.processing.has(id);
  }

  // Récupérer une tâche en cours
  getActiveTask(id) {
    return this.processing.get(id);
  }

  // Récupérer un résultat récent (moins de 30 secondes)
  hasRecentExecution(id) {
    const entry = this.results.get(id);
    if (!entry) return false;

    const ageMs = Date.now() - entry.timestamp;
    return ageMs < 30000; // 30 secondes
  }

  // Ajouter une tâche à la queue avec système de retry + fallback
  async enqueue(id, taskFn, mosqueInfo = {}) {
    // Nettoyer les résultats périmés
    this.cleanup();

    // Si déjà en cours, retourner la promesse existante
    if (this.isProcessing(id)) {
      return this.getActiveTask(id);
    }

    // Si un résultat récent existe, le retourner directement
    if (this.hasRecentExecution(id)) {
      return this.results.get(id).result;
    }

    // Créer la promesse avec système de retry et fallback
    const taskPromise = this.executeWithRetryAndFallback(
      id,
      taskFn,
      mosqueInfo
    );

    // Enregistrer la promesse
    this.processing.set(id, taskPromise);

    try {
      // Exécuter la tâche et stocker le résultat
      const result = await taskPromise;
      this.results.set(id, {
        result,
        timestamp: Date.now(),
      });

      // Réinitialiser le compteur de tentatives en cas de succès
      this.retryAttempts.delete(id);

      return result;
    } catch (error) {
      logger.error(`Erreur définitive pour mosquée ID ${id}`, {
        error: error.message,
      });
      this.retryAttempts.delete(id);
      throw error;
    } finally {
      this.processing.delete(id);
    }
  }

  // Système de retry avec 3 tentatives + fallback universel
  async executeWithRetryAndFallback(id, taskFn, mosqueInfo) {
    const execution = monitoring.startExecution(id);
    let lastError;
    const currentAttempt = (this.retryAttempts.get(id) || 0) + 1;
    this.retryAttempts.set(id, currentAttempt);

    // Phase 1: 3 tentatives de la méthode principale
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        logger.scraping.retry(
          mosqueInfo.name || `Mosquée ${id}`,
          attempt,
          this.MAX_RETRIES
        );
        monitoring.recordRetry(execution);

        const result = await Promise.race([
          taskFn(),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(`Timeout tentative ${attempt} pour mosquée ${id}`)
                ),
              TIMEOUT_DURATION
            )
          ),
        ]);

        if (result && result.times && Object.keys(result.times).length > 0) {
          logger.scraping.success(
            mosqueInfo.name || `Mosquée ${id}`,
            Date.now() - execution.startTime
          );
          monitoring.recordSuccess(execution, result);
          return result;
        } else {
          throw new Error("Données vides retournées par le scraper");
        }
      } catch (error) {
        lastError = error;
        logger.scraping.error(mosqueInfo.name || `Mosquée ${id}`, error);

        // Délai réduit entre les tentatives (500ms, 1s, 1.5s)
        if (attempt < this.MAX_RETRIES) {
          const delay = attempt * 500; // Réduit de 1000ms à 500ms
          logger.warn(
            `⏳ Attente de ${delay}ms avant tentative ${attempt + 1}`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Phase 2: Activation du fallback universel
    logger.warn(
      `🔄 Méthode principale échouée après ${this.MAX_RETRIES} tentatives`
    );
    logger.scraping.fallback(
      mosqueInfo.name || `Mosquée ${id}`,
      "Fallback universel"
    );

    try {
      const result = await this.runFallback(id, mosqueInfo);
      monitoring.recordSuccess(execution, result);

      // Log détaillé du succès du fallback
      if (result.fallbackUsed) {
        logger.info(
          `✅ Fallback "${result.fallbackUsed.strategyName}" réussi pour mosquée ID ${id}`
        );
        logger.debug(
          `Qualité: ${result.fallbackUsed.dataQuality}, Temps: ${result.fallbackUsed.duration}ms`
        );
        logger.debug(`Prières récupérées: ${Object.keys(result.times).length}`);
      }

      return result;
    } catch (fallbackError) {
      logger.error(`Fallback universel échoué pour mosquée ID ${id}`, {
        error: fallbackError.message,
      });
      monitoring.recordFailure(execution, fallbackError);
      throw fallbackError;
    }
  }

  // Méthode pour exécuter le fallback universel avec pool de navigateurs
  async runFallback(mosqueId, scraperInfo) {
    const mosqueInfo = {
      id: mosqueId,
      name: scraperInfo.name,
      url: this.getFallbackUrl(mosqueId),
    };

    // Utiliser le pool de navigateurs au lieu de créer un nouveau navigateur
    let browser;
    let page;

    try {
      logger.debug(
        `🌐 Demande navigateur du pool pour fallback mosquée ${mosqueId}`
      );
      browser = await this.browserPool.getBrowser();

      page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      // Naviguer vers l'URL de la mosquée
      logger.debug(`🌐 Navigation fallback vers: ${mosqueInfo.url}`);
      await page.goto(mosqueInfo.url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Exécuter le fallback universel
      const result = await universalFallback.execute(page, mosqueInfo);

      return result;
    } finally {
      // Libérer les ressources
      if (page) {
        await page.close();
      }
      if (browser) {
        logger.debug(`♻️ Libération navigateur vers le pool`);
        this.browserPool.releaseBrowser(browser);
      }
    }
  }

  // Mapping des URLs pour le fallback
  getFallbackUrl(mosqueId) {
    const urlMapping = {
      1: "https://aishamosque.com/",
      2: "https://alfarooqwalsall.co.uk/",
      3: "https://masjidabubakr.com/",
      4: "https://greenlanemasjid.org/",
      5: "https://centralmosque.org.uk/",
      6: "https://qubaislamiccentre.co.uk/",
      7: "https://mshuk.org/",
      8: "https://ar-rahma.co.uk/",
      9: "https://masjidumar.org.uk/",
      10: "https://amanahmasjid.com/",
      11: "https://sparkbrookmasjid.org.uk/",
      12: "https://masjidehamza.co.uk/",
      13: "https://masjidsulayman.co.uk/",
      14: "https://esaibnmaryama.com/",
      15: "https://hallgreenmosque.org.uk/",
      16: "https://kingsheathmasjid.org.uk/",
      17: "https://bournvillemasjid.org/",
      18: "https://assunnah.org.uk/",
      19: "https://masjideusmanwalsall.org.uk/",
      20: "https://masjidalaqsa.org.uk/",
      21: "https://bjm.org.uk/",
      22: "https://annoormasjid.co.uk/",
      23: "https://almasjidmahmud.com/",
    };

    return urlMapping[mosqueId] || null;
  }

  // Attendre que toutes les tâches soient terminées
  async waitForAll() {
    if (this.processing.size === 0) return;

    // Attendre toutes les tâches actives
    await Promise.allSettled(Array.from(this.processing.values()));
  }

  // Statut actuel de la queue avec statistiques du pool
  getStatus() {
    const poolStats = this.browserPool.getPoolStatus();

    return {
      active: this.processing.size,
      recentResults: this.results.size,
      retryAttempts: this.retryAttempts.size,
      browserPool: {
        available: poolStats.available,
        busy: poolStats.busy,
        total: poolStats.total,
        reuseRate: poolStats.reuseRate,
      },
    };
  }

  // Nettoyage amélioré avec maintenance du pool
  cleanup() {
    const now = Date.now();
    for (const [id, entry] of this.results.entries()) {
      if (now - entry.timestamp > RECENT_EXECUTION_TTL) {
        this.results.delete(id);
      }
    }

    // Nettoyage périodique du pool de navigateurs
    if (Math.random() < 0.1) {
      // 10% de chance à chaque cleanup
      this.browserPool.cleanup().catch((error) => {
        logger.error("Erreur nettoyage pool navigateurs", {
          error: error.message,
        });
      });
    }
  }

  // Destruction propre avec fermeture du pool
  async destroy() {
    logger.info("🔄 Destruction de la ScraperQueue...");

    // Attendre que toutes les tâches se terminent
    await this.waitForAll();

    // Détruire le pool de navigateurs
    if (this.browserPool) {
      await this.browserPool.destroy();
    }

    // Nettoyer l'état
    this.processing.clear();
    this.results.clear();
    this.retryAttempts.clear();

    logger.info("✅ ScraperQueue détruite");
  }

  // Logs des statistiques de performance
  logPerformanceStats() {
    const status = this.getStatus();
    logger.info("📊 Statistiques ScraperQueue", {
      activeTasks: status.active,
      recentResults: status.recentResults,
      browserPool: status.browserPool,
    });

    this.browserPool.logStats();
  }
}

module.exports = new ScraperQueue();
