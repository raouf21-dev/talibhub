// utils/browser-manager.js - Gestionnaire centralisé pour l'utilisation du pool de navigateurs

const { getBrowserPool } = require("./browser-pool");
const { createLogger } = require("./logger");
const humanBehavior = require("./human-behavior");

const logger = createLogger("BrowserManager");

class BrowserManager {
  constructor() {
    this.pool = getBrowserPool(4); // Pool de 4 navigateurs

    // Configuration automatique du pool avec options optimisées
    this.initializeBrowserConfig();
  }

  /**
   * Initialiser la configuration des navigateurs du pool
   */
  initializeBrowserConfig() {
    const browserConfig = {
      defaultViewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920,1080",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-images", // Optimisation: pas d'images pour le scraping
      ],
    };

    this.pool.setBrowserConfig(browserConfig);
    logger.info("🔧 Configuration navigateur appliquée au pool");
  }

  /**
   * Obtenir un navigateur optimisé du pool avec configuration standard
   */
  async getBrowser() {
    const browser = await this.pool.getBrowser();
    logger.debug("🌐 Navigateur obtenu du pool centralisé");
    return browser;
  }

  /**
   * Libérer un navigateur vers le pool
   */
  releaseBrowser(browser) {
    this.pool.releaseBrowser(browser);
    logger.debug("♻️ Navigateur libéré vers le pool centralisé");
  }

  /**
   * Créer une page optimisée avec configuration standard pour scraping
   */
  async createOptimizedPage(browser, options = {}) {
    const page = await browser.newPage();

    // Configuration standard pour tous les scrapers
    await page.setViewport({ width: 1920, height: 1080 });

    // User agent aléatoire
    const randomUserAgent = humanBehavior.getRandomUserAgent();
    await page.setUserAgent(randomUserAgent);

    // Setup comportement humain
    await humanBehavior.setupPageOptimized(page);

    // Interception optionnelle des ressources pour optimisation
    if (options.enableInterception !== false) {
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const resourceType = request.resourceType();
        if (["image", "stylesheet", "font"].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });
    }

    logger.debug("📄 Page optimisée créée avec configuration standard");
    return page;
  }

  /**
   * Fonction helper pour exécuter un scraping avec gestion automatique du browser
   */
  async executeWithBrowser(scraperFunction, options = {}) {
    let browser;
    let page;

    try {
      // Obtenir navigateur du pool
      browser = await this.getBrowser();

      // Créer page optimisée avec options
      page = await this.createOptimizedPage(browser, options);

      // Exécuter la fonction de scraping
      const result = await scraperFunction(page);

      logger.debug("✅ Scraping exécuté avec succès via pool centralisé");
      return result;
    } finally {
      // Nettoyage
      if (page) {
        await page.close();
        logger.debug("📄 Page fermée");
      }

      if (browser) {
        this.releaseBrowser(browser);
      }
    }
  }

  /**
   * Obtenir les statistiques du pool
   */
  getPoolStats() {
    return this.pool.getPoolStatus();
  }

  /**
   * Obtenir les métriques détaillées
   */
  getDetailedMetrics() {
    return this.pool.getMetrics();
  }

  /**
   * Log des statistiques
   */
  logStats() {
    this.pool.logStats();
  }

  /**
   * Nettoyer le pool
   */
  async cleanup() {
    await this.pool.cleanup();
  }

  /**
   * Détruire le pool
   */
  async destroy() {
    await this.pool.destroy();
  }
}

// Instance singleton
let globalBrowserManager = null;

const getBrowserManager = () => {
  if (!globalBrowserManager) {
    globalBrowserManager = new BrowserManager();
    logger.info(
      "🌐 BrowserManager centralisé initialisé avec configuration complète"
    );
  }
  return globalBrowserManager;
};

module.exports = {
  BrowserManager,
  getBrowserManager,
};
