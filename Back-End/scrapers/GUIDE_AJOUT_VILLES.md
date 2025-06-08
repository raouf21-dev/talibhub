# 🏙️ Guide d'ajout de nouvelles villes

Ce guide explique comment ajouter une nouvelle ville au système de scraping TalibHub2.

## 📋 Prérequis

- Connaître les mosquées de la ville et leurs sites web
- Avoir identifié les URLs des horaires de prière
- Disposer des coordonnées (latitude/longitude) si nécessaire

## 🚀 Étapes d'ajout d'une nouvelle ville

### 1. Créer la structure de répertoire

```bash
# Exemple pour la ville de Londres
mkdir -p scrapers/countries/uk/london/scraping
```

### 2. Créer les scrapers individuels

Créer un fichier par mosquée dans `scrapers/countries/uk/london/scraping/`:

```javascript
// Exemple: mosquee1London.js
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { executablePath } = require("puppeteer");
const {
  normalizeTime,
  dateUtils,
  prayerUtils,
} = require("../../../../utils/scraper");
const humanBehavior = require("../../../../utils/human-behavior");

puppeteer.use(StealthPlugin());

const scrapeMosquee1 = async (retryCount = 0) => {
  const MAX_RETRIES = 2;
  let browser;
  let page;

  try {
    console.log(
      `Démarrage du scraping Mosquée 1 Londres... ${
        retryCount > 0 ? `(Tentative ${retryCount + 1}/${MAX_RETRIES + 1})` : ""
      }`
    );

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
      ignoreHTTPSErrors: true,
      executablePath: await executablePath(),
    });

    page = await browser.newPage();
    await humanBehavior.setupPageOptimized(page);
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigation vers le site de la mosquée
    await page.goto("https://example-mosque.com/prayer-times", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Extraction des données (adapter selon le site)
    const times = await page.evaluate(() => {
      // Logique d'extraction spécifique au site
      return {
        fajr: "05:00",
        dhuhr: "13:00",
        asr: "16:30",
        maghrib: "19:00",
        isha: "21:00",
      };
    });

    // Normalisation
    const normalizedTimes = {};
    for (let [prayer, time] of Object.entries(times)) {
      prayer = prayerUtils.standardizePrayerName(prayer);
      if (prayer && time) {
        const normalizedTime = normalizeTime(time, prayer);
        if (normalizedTime) {
          normalizedTimes[prayer] = normalizedTime;
        }
      }
    }

    const result = {
      source: "Mosquée 1 Londres",
      date: dateUtils.getUKDate(),
      times: normalizedTimes,
    };

    return prayerUtils.normalizeResult(result);
  } catch (error) {
    console.error("Erreur lors du scraping de Mosquée 1:", error);
    if (retryCount < MAX_RETRIES) {
      return scrapeMosquee1(retryCount + 1);
    }
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("Navigateur fermé");
    }
  }
};

module.exports = scrapeMosquee1;
```

### 3. Créer l'index de la ville

Créer `scrapers/countries/uk/london/index.js`:

```javascript
// Index pour Londres
const {
  createCityTemplate,
  createRobustScraper,
} = require("../../../utils/city-template");

// Import des scrapers individuels
const mosquee1Scraper = require("./scraping/mosquee1London");
const mosquee2Scraper = require("./scraping/mosquee2London");
// ... autres scrapers

// Configuration des scrapers avec IDs uniques
const londonScrapers = [
  createRobustScraper(24, "Mosquée 1 Londres", mosquee1Scraper),
  createRobustScraper(25, "Mosquée 2 Londres", mosquee2Scraper),
  // ... autres mosquées
];

// Créer le gestionnaire de ville
const londonManager = createCityTemplate("Londres", londonScrapers);

module.exports = {
  city: "Londres",
  scrapers: londonScrapers,
  runAllScrapers: londonManager.runAllScrapers,
  runScraper: londonManager.runScraper,
  getInfo: londonManager.getInfo,
};
```

### 4. Mettre à jour le mapping principal

Dans `scrapers/index.js`, ajouter les nouveaux IDs au mapping :

```javascript
const DB_SCRAPER_MAPPING = {
  // Existing mappings...
  24: "mosquee1Londres",
  25: "mosquee2Londres",
  // ... autres mosquées de Londres
};
```

### 5. Configurer les scrapers dans le système principal

Dans la méthode `setupScrapers()` de `scrapers/index.js`:

```javascript
// Import du gestionnaire de Londres
const londonScrapers = require("./countries/uk/london");

// Dans setupScrapers():
londonScrapers.scrapers.forEach((scraper) => {
  this.scrapers.set(scraper.id, scraper.fn);
});
```

### 6. Mettre à jour le mapping ville dans les logs

Dans `scrapers/index.js`, fonction de logging :

```javascript
// Extraire la ville du nom de la source
let city = "unknown";
if (result.source) {
  if (result.source.includes("Birmingham")) city = "Birmingham";
  else if (result.source.includes("Walsall")) city = "Walsall";
  else if (result.source.includes("Londres")) city = "Londres"; // Nouveau
  // Ajouter d'autres villes selon le besoin
}
```

Et pour les erreurs :

```javascript
// Déterminer la ville basée sur l'ID de mosquée
let city = "unknown";
if (error.mosqueId >= 1 && error.mosqueId <= 2) city = "Walsall";
else if (error.mosqueId >= 3 && error.mosqueId <= 23) city = "Birmingham";
else if (error.mosqueId >= 24 && error.mosqueId <= 30) city = "Londres"; // Nouveau
```

### 7. Ajouter les mosquées à la base de données

```sql
-- Exemple d'insertion pour Londres
INSERT INTO mosques (id, name, address, city, latitude, longitude) VALUES
(24, 'Mosquée 1', '123 Rue Example, Londres', 'Londres', 51.5074, -0.1278),
(25, 'Mosquée 2', '456 Avenue Test, Londres', 'Londres', 51.5084, -0.1288);
-- ... autres mosquées
```

## 🧪 Tests

### 1. Tester les scrapers individuels

```bash
# Tester un scraper spécifique
node -e "
const scraper = require('./scrapers/countries/uk/london/scraping/mosquee1London.js');
scraper().then(console.log).catch(console.error);
"
```

### 2. Tester le gestionnaire de ville

```bash
# Tester tous les scrapers de Londres
node -e "
const london = require('./scrapers/countries/uk/london');
london.runAllScrapers().then(console.log).catch(console.error);
"
```

### 3. Tester l'intégration complète

```bash
# Tester avec le système principal
node scrapers/tests/test-improvements.js
```

## ✅ Vérifications finales

- [ ] Tous les scrapers individuels fonctionnent
- [ ] Le gestionnaire de ville affiche "Scraping terminé pour [VILLE]"
- [ ] Les IDs sont uniques et non conflictuels
- [ ] Les mosquées sont ajoutées à la DB
- [ ] Le mapping principal est mis à jour
- [ ] Les logs par ville fonctionnent correctement

## 🔧 Outils disponibles

### Template de ville (automatique)

Utilise `utils/city-template.js` pour créer automatiquement :

- Gestion d'erreurs robuste
- Retry automatique
- Logs standardisés
- Métriques de performance

### Scraper robuste (automatique)

Utilise `createRobustScraper()` pour :

- Retry automatique (2 tentatives par défaut)
- Gestion d'erreurs
- Logs détaillés

## 📞 Support

En cas de problème :

1. Vérifier les logs pour identifier l'erreur
2. Tester les scrapers individuellement
3. Utiliser les scripts de diagnostic (`debug-*.js`)
4. Consulter la documentation des utilitaires (`utils/scraper.js`)

## 🎯 Exemple complet

Voir les implémentations existantes :

- `scrapers/countries/uk/birmingham/` (ville complexe avec 21 mosquées)
- `scrapers/countries/uk/walsall/` (ville simple avec 4 mosquées)

Ces exemples montrent les bonnes pratiques et patterns à suivre.
