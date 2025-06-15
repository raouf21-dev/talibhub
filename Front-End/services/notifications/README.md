# 🔔 Système de Notifications Temporaires (Toast/Popup)

## 📋 Vue d'ensemble

Le système de notifications temporaires de TalibHub fournit des **messages de feedback instantané** sous forme de toasts/popups pour informer l'utilisateur d'actions, d'erreurs ou de confirmations. Ces notifications apparaissent temporairement en haut à droite de l'écran et disparaissent automatiquement.

## 🎯 Objectif

Contrairement au **système de messagerie persistante** (centre de messages), les notifications temporaires sont destinées à :

- ✅ Feedback immédiat d'actions utilisateur
- ⚠️ Messages d'erreur courts
- ✅ Confirmations de succès
- ❓ Demandes de confirmation
- 📝 Messages informatifs temporaires

## 🏗️ Architecture

### Structure des fichiers

```
Front-End/services/notifications/
├── notificationService.js    # Service principal
├── README.md                # Cette documentation
```

### Système de traductions intégré

Les notifications utilisent le système de traductions centralisé de TalibHub :

- **Fichier principal** : `Front-End/utils/translations.js`
- **Support multilingue** : français/anglais
- **Clés organisées** par domaine fonctionnel

## 🚀 Utilisation

### Import du service

```javascript
// Le service est automatiquement disponible globalement
window.notificationService;
```

### Méthodes principales

#### 1. `show()` - Notification simple

```javascript
notificationService.show(messageKey, type, duration, params);
```

**Paramètres :**

- `messageKey` (string) : Clé de traduction du message
- `type` (string) : Type de notification (`success`, `warning`, `error`, `info`)
- `duration` (number, optionnel) : Durée en millisecondes (défaut: 3000ms, 0 = persistant)
- `params` (object, optionnel) : Variables pour placeholders

**Exemples :**

```javascript
// Notification simple
notificationService.show("auth.signin.success", "success");

// Notification persistante (ne disparaît pas automatiquement)
notificationService.show("profile.load.error", "error", 0);

// Notification avec paramètres
notificationService.show("auth.field.required", "warning", 3000, {
  field: "email",
});

// Notification avec durée personnalisée
notificationService.show("surah.saved", "success", 5000);
```

#### 2. `confirm()` - Demande de confirmation

```javascript
const confirmed = await notificationService.confirm(
  messageKey,
  confirmText,
  cancelText
);
```

**Exemple :**

```javascript
const result = await notificationService.confirm(
  "confirm.delete.task",
  "Supprimer",
  "Annuler"
);

if (result) {
  // Utilisateur a confirmé
  deleteTask();
}
```

## 🎨 Types de notifications

### Success ✅

- **Couleur** : Vert (#4CAF50)
- **Usage** : Actions réussies, confirmations
- **Icône** : Checkmark
- **Exemples** : `auth.signin.success`, `surah.saved`

### Warning ⚠️

- **Couleur** : Orange (#FF9800)
- **Usage** : Avertissements, validations
- **Icône** : Triangle d'avertissement
- **Exemples** : `auth.required.fields`, `task.empty`

### Error ❌

- **Couleur** : Rouge (#F44336)
- **Usage** : Erreurs, échecs d'actions
- **Icône** : X
- **Exemples** : `auth.signin.error`, `surah.load_error`

### Info ℹ️

- **Couleur** : Bleu (#2196F3)
- **Usage** : Informations, états
- **Icône** : i
- **Exemples** : `dua.geolocation.searching`, `timer.work_session_started`

### Confirm ❓

- **Couleur** : Violet (#9C27B0)
- **Usage** : Demandes de confirmation
- **Icône** : Question/Check
- **Uniquement avec** `confirm()`

## 🌍 Système de traductions

### Organisation des clés

Les clés de traduction sont organisées par domaine :

```javascript
// Authentification
"auth.signin.success": "Connexion réussie ! Redirection...",
"auth.email.mismatch": "Les adresses email ne correspondent pas",

// Profil utilisateur
"profile.update.success": "Profil mis à jour avec succès",
"profile.password.weak": "Le mot de passe est trop faible",

// Gestion des sourates
"surah.saved": "Sourates sauvegardées avec succès",
"surah.load_error": "Erreur lors du chargement des sourates",

// Sessions et timer
"session.saved": "Session sauvegardée avec succès",
"timer.duration_updated": "Durée du timer mise à jour",

// Tâches
"task.added": "Tâche ajoutée avec succès",
"task.empty": "Le nom de la tâche ne peut pas être vide",
```

### Placeholders

Le système supporte les variables dynamiques :

```javascript
// Dans translations.js
"auth.field.required": "Le champ {field} est requis",
"surah.level.selected": "Sourates niveau {level} sélectionnées",

// Utilisation
notificationService.show("auth.field.required", "warning", 3000, { field: "email" });
notificationService.show("surah.level.selected", "success", 3000, { level: "Fort" });
```

## 🎛️ Configuration

### Durées par défaut

- **Success/Info** : 3000ms (3 secondes)
- **Warning** : 3000ms (3 secondes)
- **Error** : Peut être persistant (duration: 0)
- **Confirm** : Jusqu'à réponse utilisateur

### Positionnement

- **Desktop** : Haut droite, stack vertical
- **Mobile** : Pleine largeur, responsive

### Animations

- **Entrée** : Slide depuis la droite + fade in
- **Sortie** : Fade out + slide vers la droite
- **Durée** : 300ms, ease

## 🧪 Exemples d'utilisation par domaine

### Authentification

```javascript
// Validation de formulaire
notificationService.show("auth.required.fields", "warning");
notificationService.show("auth.email.mismatch", "warning");

// Résultats de connexion
notificationService.show("auth.signin.success", "success");
notificationService.show("auth.signin.error", "error");

// CAPTCHA
notificationService.show("auth.captcha.expired", "warning");
```

### Gestion des sourates

```javascript
// Chargement et sauvegarde
notificationService.show("surah.load_error", "error", 0);
notificationService.show("surah.saved", "success");

// Sélections
notificationService.show("surah.overdue.selected", "success");
notificationService.show("surah.none.selected", "error");

// Révisions
notificationService.show("surah.revision.complete", "success");
```

### Timer et sessions

```javascript
// États de session
notificationService.show("session.restored", "success");
notificationService.show("session.select_task_before_start", "warning");

// Actions du timer
notificationService.show("timer.work_session_started", "info");
notificationService.show("timer.duration_updated", "success");

// Erreurs
notificationService.show("session.save_error", "error", 0);
```

## 📱 Responsive Design

### Desktop (> 640px)

- Position fixe en haut à droite
- Largeur maximale : 450px
- Stack vertical avec gap de 10px

### Mobile (≤ 640px)

- Pleine largeur avec marges latérales
- Position ajustée pour éviter le débordement
- Taille de police adaptée

## 🔧 API Technique

### Classe NotificationService

#### Méthodes publiques

```javascript
// Affichage de notification
show(messageKey, type, duration, params)

// Demande de confirmation
async confirm(messageKey, confirmText, cancelText)

// Suppression manuelle
remove(notification)
```

#### Méthodes internes

```javascript
// Gestion des traductions
getTranslation(messageKey, type);

// Gestion des icônes
getIconForType(type);

// Injection des styles CSS
injectStyles();

// Mise à jour lors changement de langue
updateNotificationsLanguage();
```

### Intégration avec le système de traductions

```javascript
// Écoute automatique des changements de langue
if (window.translationManager) {
  window.translationManager.addObserver((newLang) => {
    this.currentLang = newLang;
    this.updateNotificationsLanguage();
  });
}
```

## 📝 Bonnes pratiques

### ✅ À faire

1. **Utiliser des clés de traduction** plutôt que du texte en dur
2. **Choisir le bon type** selon le contexte (success, error, warning, info)
3. **Durée appropriée** : 0 pour erreurs importantes, 3000ms par défaut
4. **Messages concis** et informatifs
5. **Tester dans les deux langues** (français/anglais)

### ❌ À éviter

1. **Messages hardcodés** : `notificationService.show("Erreur", "error")`
2. **Durées trop courtes** pour des messages importants
3. **Surcharge** : trop de notifications simultanées
4. **Messages trop longs** qui débordent sur mobile
5. **Oubli des paramètres** pour messages dynamiques

## 🆚 Notifications vs Messagerie

| Aspect         | Notifications Temporaires  | Centre de Messagerie |
| -------------- | -------------------------- | -------------------- |
| **Durée**      | Temporaire (3s par défaut) | Persistant           |
| **Position**   | Toast flottant             | Centre dédié         |
| **Usage**      | Feedback immédiat          | Historique, annonces |
| **Stockage**   | Aucun                      | LocalStorage         |
| **Actions**    | Fermeture simple           | Lecture, suppression |
| **Catégories** | Types (success, error...)  | Catégories métier    |

## 🔄 Historique des versions

### v2.1.0 (Actuel)

- ✅ Intégration complète avec le système de traductions
- ✅ Support des placeholders dynamiques
- ✅ Correction de tous les messages hardcodés
- ✅ API standardisée et cohérente
- ✅ Documentation complète

### v2.0.0

- ✅ Séparation des notifications temporaires et de la messagerie
- ✅ Refactoring complet de l'architecture
- ✅ Support multilingue amélioré

### v1.x

- ⚠️ Système mixte avec incohérences
- ⚠️ Messages hardcodés en français

## 🤝 Contribution

Pour ajouter une nouvelle notification :

1. **Ajouter la clé** dans `Front-End/utils/translations.js` (français et anglais)
2. **Utiliser la clé** : `notificationService.show("nouvelle.cle", "type")`
3. **Tester** dans les deux langues
4. **Documenter** si nécessaire

**Exemple complet :**

```javascript
// 1. Ajouter dans translations.js
"task.priority.updated": "Priorité de la tâche mise à jour",
"task.priority.updated": "Task priority updated", // Version anglaise

// 2. Utiliser dans le code
notificationService.show("task.priority.updated", "success");
```

---

> **Note :** Cette documentation couvre le système de notifications temporaires uniquement. Pour le centre de messagerie persistante, consultez `Front-End/components/messaging/README.md`.
