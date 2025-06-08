# 🔄 Système Simple de Scraping avec Polling

## 📋 Vue d'ensemble

Ce document décrit le nouveau système simplifié pour la mise à jour automatique des horaires de mosquées. Ce système remplace l'ancien système complexe par une approche simple basée sur le **polling d'API**.

## 🎯 Principe Simple

```
1. Vérifier si données existent pour aujourd'hui
2. Si NON → Déclencher scraping + démarrer polling
3. Polling API jusqu'à completion
4. Quand terminé → Rafraîchir données sans cache
```

## 🔧 Implémentation

### **Frontend - Méthodes Principales**

#### `startScrapingWithPolling()`

- Déclenche le scraping via `POST /mosque-times/scrape-all`
- Récupère un `requestId` du backend
- Démarre immédiatement le polling de statut

#### `startStatusPolling()`

- Poll l'API `GET /scraping-status/{requestId}` toutes les 3 secondes
- Gère les statuts : `processing`, `completed`, `failed`, `timeout`
- S'arrête automatiquement à la fin

#### `refreshDataWithoutCache()`

- Vide le cache pour la ville courante
- Recharge les données fraîches depuis l'API
- Aucune complexité, juste un refresh simple

### **Backend - APIs Utilisées**

#### `POST /mosque-times/scrape-all`

```json
Response: {
  "status": "processing",
  "requestId": "1234567890",
  "message": "Scraping démarré avec succès"
}
```

#### `GET /scraping-status/:requestId`

```json
Response: {
  "status": "completed|failed|timeout|processing",
  "requestId": "1234567890",
  "progress": { "total": 24, "completed": 23, "failed": 1 },
  "completedAt": "2025-01-03T12:34:56Z"
}
```

## ✅ Avantages du Nouveau Système

- **Simplicité** : Plus de système d'événements complexe
- **Fiabilité** : Polling direct de l'API backend
- **Lisibilité** : Code facile à comprendre et maintenir
- **Performance** : Pas de cache compliqué, juste un refresh simple
- **Debugging** : Logs clairs avec emojis pour chaque étape

## 🔄 Flow Complet

```
checkAndUpdateData()
├── Vérifier si données existent (API exists)
├── Si NON:
│   ├── startScrapingWithPolling()
│   │   ├── POST /scrape-all → récupère requestId
│   │   └── startStatusPolling()
│   │       ├── Poll toutes les 3s
│   │       ├── Quand completed → stopStatusPolling()
│   │       └── refreshDataWithoutCache()
│   │           ├── Vider cache ville courante
│   │           └── handleCitySelection() avec données fraîches
│   └── Notification succès
└── Si OUI: Charger données existantes
```

## 🧪 Testing

Pour tester le système, dans la console browser :

```javascript
// Démarrer manuellement un scraping
window.welcomeMosqueTime?.startScrapingWithPolling();

// Vérifier l'état du polling
console.log(window.welcomeMosqueTime?.pollingInterval);
console.log(window.welcomeMosqueTime?.currentRequestId);
```

## 🚀 Mise en Production

Le système est prêt pour la production avec :

- Gestion d'erreurs robuste
- Polling qui continue même en cas d'erreur temporaire
- Nettoyage automatique des intervalles
- Notifications utilisateur claires
