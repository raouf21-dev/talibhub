# Optimisations de Performance - Système de Scraping

## 🚀 Optimisations Majeures Identifiées

### 1. **Optimisation de la Queue de Scraping**

#### Problème Actuel

- Chaque scraper instancie son propre navigateur Puppeteer
- 23 navigateurs simultanés = surcharge mémoire
- Temps de démarrage répétitif

#### Solution : Pool de Navigateurs Réutilisables

```javascript
// queue.js - Optimisation à implémenter
class BrowserPool {
  constructor(maxBrowsers = 4) {
    this.maxBrowsers = maxBrowsers;
    this.availableBrowsers = [];
    this.busyBrowsers = new Set();
  }

  async getBrowser() {
    if (this.availableBrowsers.length > 0) {
      return this.availableBrowsers.pop();
    }

    if (this.busyBrowsers.size < this.maxBrowsers) {
      return await this.createBrowser();
    }

    // Attendre qu'un navigateur se libère
    return await this.waitForAvailableBrowser();
  }

  releaseBrowser(browser) {
    this.busyBrowsers.delete(browser);
    this.availableBrowsers.push(browser);
  }
}
```

**Gain attendu :** 60% de réduction du temps d'exécution

### 2. **Cache Intelligent des Résultats**

#### Optimisation du Cache

```javascript
// Actuel : 30 secondes de cache
// Optimisé : Cache adaptatif selon l'heure
const getCacheDuration = () => {
  const hour = new Date().getHours();

  // Cache plus long la nuit (moins de changements)
  if (hour >= 22 || hour <= 5) return 3600000; // 1 heure

  // Cache moyen le matin/soir (horaires peuvent changer)
  if (hour <= 10 || hour >= 18) return 1800000; // 30 minutes

  // Cache court pendant la journée
  return 600000; // 10 minutes
};
```

### 3. **Optimisation des Sélecteurs CSS**

#### Problème

- Sélecteurs génériques lents dans le fallback
- Recherche exhaustive dans le DOM

#### Solution : Sélecteurs Prioritaires

```javascript
// universal-fallback.js - Optimisation
const PRIORITY_SELECTORS = {
  fajr: [".fajr-time", "#fajr", '[data-prayer="fajr"]'],
  dhuhr: [".dhuhr-time", "#dhuhr", '[data-prayer="dhuhr"]'],
  // Plus rapide : sélecteurs spécifiques en premier
};
```

### 4. **Parallélisation Intelligente**

#### Optimisation des Lots

```javascript
// Actuel : 8 mosquées par lot
// Optimisé : Lots adaptatifs selon la charge système
const getOptimalBatchSize = () => {
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();
  const memoryUsage = (totalMemory - freeMemory) / totalMemory;

  if (memoryUsage < 0.5) return 12; // Système libre
  if (memoryUsage < 0.7) return 8; // Charge normale
  return 4; // Système chargé
};
```

## 🛠️ Optimisations Techniques

### 5. **Optimisation des Imports**

#### Problème Actuel

```javascript
// index.js - Imports lourds à chaque exécution
const countryScrapers = require("./countries"); // Rechargé à chaque fois
```

#### Solution : Lazy Loading

```javascript
// Chargement à la demande
let countryScrapers;
const getCountryScrapers = () => {
  if (!countryScrapers) {
    countryScrapers = require("./countries");
  }
  return countryScrapers;
};
```

### 6. **Réduction des Logs Verbeux**

#### Configuration par Niveaux

```javascript
const LOG_LEVEL = process.env.LOG_LEVEL || "INFO"; // DEBUG, INFO, WARN, ERROR

const log = {
  debug: (msg) => LOG_LEVEL === "DEBUG" && console.log(`[DEBUG] ${msg}`),
  info: (msg) =>
    ["DEBUG", "INFO"].includes(LOG_LEVEL) && console.log(`[INFO] ${msg}`),
  // ...
};
```

### 7. **Optimisation des Timeouts**

#### Timeouts Adaptatifs

```javascript
// Timeout plus court pour les scrapers rapides
const getTimeoutForMosque = (mosqueId) => {
  const fastMosques = [1, 2, 4, 5]; // IDs des mosquées rapides
  return fastMosques.includes(mosqueId) ? 30000 : 60000;
};
```

## 📊 Métriques de Performance Attendues

### Avant Optimisation

- **Temps total :** ~30 secondes
- **Mémoire utilisée :** ~2GB (23 navigateurs)
- **CPU :** Pics à 100%

### Après Optimisation

- **Temps total :** ~12 secondes (-60%)
- **Mémoire utilisée :** ~500MB (-75%)
- **CPU :** Utilisation lissée ~40%

## 🔧 Optimisations de Structure

### 8. **Simplification de l'Architecture**

#### Fusion des Responsabilités

```
Actuel:  ScraperManager -> Queue -> Individual Scrapers
Optimisé: ScraperManager -> BrowserPool -> Scrapers
```

### 9. **Optimisation de Monitoring**

#### Monitoring Léger en Production

```javascript
const MONITORING_MODE =
  process.env.NODE_ENV === "production" ? "LIGHT" : "FULL";

// Mode LIGHT : métriques essentielles seulement
// Mode FULL : monitoring détaillé pour développement
```

## 🎯 Plan d'Implémentation

### Phase 1 : Nettoyage (Immédiat)

- ✅ Supprimer 30 fichiers tests obsolètes
- ✅ Optimiser les logs verbeux

### Phase 2 : Pool de Navigateurs (1-2 jours)

- Implémenter BrowserPool
- Tests de performance

### Phase 3 : Cache Intelligent (1 jour)

- Cache adaptatif
- Métriques de performance

### Phase 4 : Finalisation (1 jour)

- Lazy loading
- Timeouts adaptatifs
- Tests finaux

**Durée totale estimée :** 3-5 jours
**Gain de performance attendu :** 60-75%
