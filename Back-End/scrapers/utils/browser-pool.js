// utils/browser-pool.js - Pool de navigateurs réutilisables

const { createLogger } = require("./logger");
const logger = createLogger("BrowserPool");

class BrowserPool {
  constructor(maxBrowsers = 4) {
    this.maxBrowsers = maxBrowsers;
    this.availableBrowsers = [];
    this.busyBrowsers = new Set();
    this.browserConfig = null;
    this.waitingQueue = [];
    this.totalCreated = 0;
    this.totalReused = 0;

    // Sémaphore pour éviter les race conditions
    this.creationLock = false;
    this.pendingCreations = 0;

    logger.info(`🌐 Pool de navigateurs initialisé (Max: ${maxBrowsers})`);
  }

  // Configurer les options des navigateurs
  setBrowserConfig(config) {
    this.browserConfig = config;
    logger.debug("🔧 Configuration navigateur mise à jour");
  }

  // Créer un nouveau navigateur avec la configuration
  async createBrowser() {
    if (!this.browserConfig) {
      throw new Error(
        "Configuration navigateur non définie. Appelez setBrowserConfig() d'abord."
      );
    }

    const puppeteer = require("puppeteer-extra");
    const StealthPlugin = require("puppeteer-extra-plugin-stealth");
    const { executablePath } = require("puppeteer");

    // Configuration stealth
    const stealth = StealthPlugin();
    stealth.enabledEvasions.delete("webgl.vendor");
    stealth.enabledEvasions.delete("webgl.renderer");
    puppeteer.use(stealth);

    // Options optimisées pour le pool
    const browserOptions = {
      headless: "new",
      executablePath: await executablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-images", // Optimisation: pas d'images
        "--disable-javascript", // Sera réactivé si nécessaire
      ],
      ...this.browserConfig,
    };

    const browser = await puppeteer.launch(browserOptions);

    // Ajouter des métadonnées au navigateur
    browser._poolId = `browser_${Date.now()}_${this.totalCreated}`;
    browser._createdAt = Date.now();
    browser._usageCount = 0;

    this.totalCreated++;
    logger.browser.create(this.getPoolStatus().total);

    return browser;
  }

  // Obtenir un navigateur du pool
  async getBrowser() {
    // Si un navigateur est disponible, le réutiliser
    if (this.availableBrowsers.length > 0) {
      const browser = this.availableBrowsers.pop();
      this.busyBrowsers.add(browser);
      browser._usageCount++;
      this.totalReused++;

      logger.browser.reuse(this.getPoolStatus().total);
      return browser;
    }

    // Vérifier le total de navigateurs incluant les créations en cours
    const totalBrowsers =
      this.busyBrowsers.size +
      this.availableBrowsers.length +
      this.pendingCreations;

    // Si on peut créer un nouveau navigateur (total < maxBrowsers)
    if (totalBrowsers < this.maxBrowsers) {
      // Incrémenter le compteur de créations en cours pour éviter la race condition
      this.pendingCreations++;

      try {
        const browser = await this.createBrowser();
        this.busyBrowsers.add(browser);
        browser._usageCount++;
        return browser;
      } finally {
        // Décrémenter le compteur une fois la création terminée
        this.pendingCreations--;
      }
    }

    // Sinon, attendre qu'un navigateur se libère
    logger.debug(
      `⏳ File d'attente pour navigateur (${totalBrowsers}/${this.maxBrowsers} en cours, ${this.waitingQueue.length} en attente)`
    );
    return await this.waitForAvailableBrowser();
  }

  // Attendre qu'un navigateur soit disponible
  async waitForAvailableBrowser() {
    return new Promise((resolve) => {
      this.waitingQueue.push(resolve);
    });
  }

  // Libérer un navigateur et le remettre dans le pool
  releaseBrowser(browser) {
    if (!browser || !this.busyBrowsers.has(browser)) {
      logger.warn("Tentative de libération d'un navigateur non géré");
      return;
    }

    this.busyBrowsers.delete(browser);

    // Si quelqu'un attend, lui donner directement
    if (this.waitingQueue.length > 0) {
      const resolver = this.waitingQueue.shift();
      this.busyBrowsers.add(browser);
      browser._usageCount++;
      resolver(browser);
      return;
    }

    // Sinon, remettre dans le pool
    this.availableBrowsers.push(browser);
    logger.browser.release(this.getPoolStatus().total);
  }

  // Nettoyer les navigateurs anciens ou sur-utilisés
  async cleanup(forceCloseAll = false) {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const maxUsage = 50; // 50 utilisations max

    let closedCount = 0;

    // Nettoyer les navigateurs disponibles
    const toKeep = [];

    for (const browser of this.availableBrowsers) {
      const age = now - browser._createdAt;
      const shouldClose =
        forceCloseAll || age > maxAge || browser._usageCount > maxUsage;

      if (shouldClose) {
        try {
          await browser.close();
          closedCount++;
        } catch (error) {
          logger.error("Erreur fermeture navigateur", { error: error.message });
        }
      } else {
        toKeep.push(browser);
      }
    }

    this.availableBrowsers = toKeep;

    if (closedCount > 0) {
      logger.browser.cleanup(closedCount);
    }

    return closedCount;
  }

  // Fermer complètement le pool
  async destroy() {
    logger.info("🔄 Destruction du pool de navigateurs...");

    // Fermer tous les navigateurs disponibles
    const availableClosing = this.availableBrowsers.map((browser) =>
      browser.close()
    );

    // Fermer tous les navigateurs occupés
    const busyClosing = Array.from(this.busyBrowsers).map((browser) =>
      browser.close()
    );

    try {
      await Promise.allSettled([...availableClosing, ...busyClosing]);
    } catch (error) {
      logger.error("Erreur destruction pool", { error: error.message });
    }

    // Réinitialiser l'état
    this.availableBrowsers = [];
    this.busyBrowsers.clear();
    this.waitingQueue = [];

    logger.info("✅ Pool de navigateurs détruit");
  }

  // Obtenir les statistiques du pool
  getPoolStatus() {
    return {
      available: this.availableBrowsers.length,
      busy: this.busyBrowsers.size,
      total: this.availableBrowsers.length + this.busyBrowsers.size,
      waiting: this.waitingQueue.length,
      maxBrowsers: this.maxBrowsers,
      totalCreated: this.totalCreated,
      totalReused: this.totalReused,
      reuseRate:
        this.totalCreated > 0
          ? ((this.totalReused / this.totalCreated) * 100).toFixed(1) + "%"
          : "0%",
    };
  }

  // Obtenir les métriques de performance
  getMetrics() {
    const status = this.getPoolStatus();
    const avgUsage =
      this.availableBrowsers.reduce(
        (acc, browser) => acc + browser._usageCount,
        0
      ) / Math.max(this.availableBrowsers.length, 1);

    return {
      ...status,
      averageUsagePerBrowser: Math.round(avgUsage),
      memoryOptimization: `${Math.round((1 - status.total / 23) * 100)}%`,
      efficiency: status.total > 0 ? "Optimisé" : "Inactif",
    };
  }

  // Log des statistiques détaillées
  logStats() {
    const metrics = this.getMetrics();
    logger.info("📊 Statistiques du pool de navigateurs", {
      disponibles: metrics.available,
      occupés: metrics.busy,
      total: metrics.total,
      créés: metrics.totalCreated,
      réutilisés: metrics.totalReused,
      tauxRéutilisation: metrics.reuseRate,
      optimisationMémoire: metrics.memoryOptimization,
    });
  }
}

// Instance singleton du pool
let globalBrowserPool = null;

// Factory pour obtenir ou créer le pool global
const getBrowserPool = (maxBrowsers = 4) => {
  if (!globalBrowserPool) {
    globalBrowserPool = new BrowserPool(maxBrowsers);
  }
  return globalBrowserPool;
};

// Nettoyer le pool global
const destroyGlobalPool = async () => {
  if (globalBrowserPool) {
    await globalBrowserPool.destroy();
    globalBrowserPool = null;
  }
};

module.exports = {
  BrowserPool,
  getBrowserPool,
  destroyGlobalPool,
};
