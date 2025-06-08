# 📊 Système de Monitoring TalibHub2

## Vue d'ensemble

Le système de monitoring surveille automatiquement vos scrapers **uniquement lors de leur exécution**. Il ne crée aucune redondance et s'intègre de manière transparente.

## 🎯 Fonctionnalités

### ✅ Surveillance automatique

- **Activation uniquement lors du scraping** - pas de processus en arrière-plan
- Mesure du temps de réponse de chaque scraper
- Détection des succès/échecs
- Historique des 50 dernières exécutions par scraper

### 🔍 Détection intelligente

- **Scrapers lents** : > 15 secondes
- **Échecs consécutifs** : 3 échecs de suite = problématique
- **Changements de sites** : détection automatique
- **Catégorisation des erreurs** : timeout, réseau, structure site, etc.

### 📈 Métriques disponibles

- Taux de succès global
- Temps de réponse moyen
- Identification des scrapers problématiques
- Statistiques des dernières 24h

## 🚀 Utilisation

### 1. Monitoring en temps réel (via Node.js)

```javascript
const { monitoring } = require("./utils/monitoring");

// Statut simple
const health = monitoring.getHealthStatus();
console.log(`Statut: ${health.statut}`); // excellent, stable, dégradé, critique
console.log(`Message: ${health.message}`);

// Métriques détaillées
const metrics = monitoring.getMetrics();
console.log(`Taux de succès: ${metrics.résumé.taux_succès}%`);
console.log(`Temps moyen: ${metrics.performance.temps_réponse_moyen_sec}s`);
```

### 2. API REST (si ajoutée au contrôleur)

```bash
# Statut rapide
curl http://localhost:3000/api/monitoring/health

# Métriques complètes
curl http://localhost:3000/api/monitoring/metrics

# Problèmes seulement
curl http://localhost:3000/api/monitoring/problems

# Réinitialiser
curl -X POST http://localhost:3000/api/monitoring/reset
```

### 3. Scripts de test

```bash
# Test simple du monitoring
node tests/test-monitoring-simple.js

# Test avec vrais scrapers
node tests/test-monitoring-real.js

# Test d'intégration complet
node tests/test-monitoring-integration.js
```

## 📋 États de santé

| Statut        | Description       | Signification                               |
| ------------- | ----------------- | ------------------------------------------- |
| **excellent** | Aucun problème    | Tous les scrapers fonctionnent parfaitement |
| **stable**    | Problèmes mineurs | Quelques problèmes sans impact majeur       |
| **dégradé**   | Problèmes moyens  | Performance dégradée mais fonctionnel       |
| **critique**  | Problèmes graves  | Échecs consécutifs ou pannes majeures       |

## 🔧 Configuration

Le monitoring est configuré avec des seuils par défaut :

```javascript
// Dans utils/monitoring.js
this.slowThreshold = 15000; // 15 secondes = lent
this.failureThreshold = 3; // 3 échecs consécutifs = problématique
this.maxHistory = 50; // Garder 50 dernières exécutions
```

## 🎯 Cas d'usage recommandés

### 🔍 Vérification quotidienne

```bash
node tests/test-monitoring-simple.js
```

### 📊 Rapport hebdomadaire

```javascript
const metrics = monitoring.getMetrics();
// Analyser les tendances, scrapers lents, etc.
```

### 🚨 Alertes automatiques

```javascript
const problems = monitoring.getMetrics().problèmes;
if (problems.length > 0) {
  // Envoyer notification email/SMS
}
```

### 🔧 Maintenance

```javascript
// Reset mensuel automatique
monitoring.reset();
```

## 🎉 Avantages

- **✅ Zéro redondance** : Se déclenche uniquement lors du scraping
- **✅ Transparence totale** : S'intègre sans modifier le comportement existant
- **✅ Détection proactive** : Identifie les problèmes avant qu'ils ne deviennent critiques
- **✅ Simplicité** : Facile à comprendre et utiliser
- **✅ Performance** : Impact minimal sur les performances

## 🚀 Intégration avec votre système

Le monitoring s'active automatiquement à chaque appel de `runScraper()` ou `runAllScrapers()`. Aucune modification de votre code existant n'est nécessaire.

### Exemple d'intégration dans un dashboard

```html
<div id="monitoring-status">
  <span id="health-status">Chargement...</span>
  <span id="success-rate">-</span>
</div>

<script>
  async function updateMonitoring() {
    try {
      const response = await fetch("/api/monitoring/health");
      const data = await response.json();

      document.getElementById("health-status").textContent = data.health.statut;
      document.getElementById("success-rate").textContent =
        data.health.taux_succès_global + "%";
    } catch (error) {
      console.error("Erreur monitoring:", error);
    }
  }

  // Actualiser toutes les 30 secondes
  setInterval(updateMonitoring, 30000);
</script>
```

---

**Le monitoring TalibHub2 est maintenant actif et surveille vos scrapers de manière intelligente ! 🎯**
