// humanBehaviorUtils.js - Module complet pour le comportement humain et anti-détection
// Contient tout ce qui simule un comportement humain ou évite la détection

// User Agents variés pour simuler différents navigateurs
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0",
];

// Configuration navigateur pour l'anti-détection
const getAntiDetectionBrowserConfig = () => ({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-blink-features=AutomationControlled", // Anti-détection
    "--disable-features=IsolateOrigins,site-per-process", // Anti-détection
    "--window-size=1920,1080",
  ],
  ignoreHTTPSErrors: true,
});

// Headers HTTP qui simulent un comportement humain
const getHumanLikeHeaders = () => ({
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9", // Préférence linguistique humaine
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  DNT: "1", // Do Not Track - comportement humain
});

// Utilitaires de comportement humain
const humanBehavior = {
  // Délai aléatoire pour simuler l'hésitation humaine
  async randomDelay(min = 100, max = 300) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  },

  // Simulation de défilement humain
  async simulateScroll(page) {
    await page.evaluate(async () => {
      const height = document.documentElement.scrollHeight;
      const duration = Math.floor(Math.random() * (800 - 500) + 500);
      const scrollStep = Math.floor(height / 4);

      for (let i = 0; i < height; i += scrollStep) {
        window.scrollTo(0, i);
        await new Promise((resolve) => setTimeout(resolve, duration / 4));
      }
    });
  },

  // Simulation de mouvement de souris aléatoire
  async moveMouseRandomly(page, selector) {
    try {
      const element = await page.$(selector);
      if (!element) return;

      const box = await element.boundingBox();
      if (!box) return;

      // Points de contrôle pour une courbe de Bézier (mouvement humain)
      const points = [
        {
          x: Math.random() * box.width + box.x,
          y: Math.random() * box.height + box.y,
        },
        {
          x: Math.random() * box.width + box.x,
          y: Math.random() * box.height + box.y,
        },
      ];

      await page.mouse.move(points[0].x, points[0].y, { steps: 5 });
      await page.mouse.move(points[1].x, points[1].y, { steps: 5 });
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
        steps: 5,
      });
    } catch (error) {
      // Silently fail to not impact scraping performance
      console.debug("Mouse movement simulation skipped");
    }
  },

  // Configuration anti-détection avancée
  async setupAntiDetection(page) {
    await page.evaluateOnNewDocument(() => {
      // Masquer les traces de Puppeteer/Automation
      delete Object.getPrototypeOf(navigator).webdriver;

      // Simuler un vrai navigateur
      const newProto = navigator.__proto__;
      newProto.webdriver = false;
      navigator.__proto__ = newProto;

      // Simuler des plugins communs
      Object.defineProperty(navigator, "plugins", {
        get: () => [
          {
            0: { type: "application/x-google-chrome-pdf" },
            description: "Portable Document Format",
            suffixes: "pdf",
            type: "application/x-google-chrome-pdf",
            filename: "internal-pdf-viewer",
          },
        ],
      });

      // Simuler une langue et une plateforme
      Object.defineProperty(navigator, "language", { get: () => "en-US" });
      Object.defineProperty(navigator, "platform", { get: () => "Win32" });

      // Simuler un historique de navigation
      window.history.length = Math.floor(Math.random() * 3) + 2;

      // Masquer la chaîne d'utilisateur WebGL
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (parameter) {
        if (parameter === 37445) return "Intel Inc.";
        if (parameter === 37446) return "Intel Iris OpenGL Engine";
        return getParameter.apply(this, [parameter]);
      };
    });
  },

  // Configuration complète d'une page avec anti-détection
  async setupHumanPage(page) {
    // User agent aléatoire
    const randomUserAgent =
      userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);

    // Configuration de base
    await page.setDefaultNavigationTimeout(30000);
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setExtraHTTPHeaders(getHumanLikeHeaders());

    // Anti-détection avancée
    await this.setupAntiDetection(page);

    // Délai initial humain
    await this.randomDelay(200, 500);
  },

  // Sélectionner un user agent aléatoire
  getRandomUserAgent() {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  },
};

// Export de tout le module comportement humain
module.exports = {
  // Fonctions principales
  ...humanBehavior,

  // Configurations
  userAgents,
  getAntiDetectionBrowserConfig,
  getHumanLikeHeaders,

  // Alias pour compatibilité
  humanBehavior,

  // Rétrocompatibilité avec l'ancienne interface
  randomDelay: humanBehavior.randomDelay,
  simulateScroll: humanBehavior.simulateScroll,
  moveMouseRandomly: humanBehavior.moveMouseRandomly,
  setupPageOptimized: humanBehavior.setupAntiDetection, // Ancien nom
};
