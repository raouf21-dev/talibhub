# 🌍 Système de Traduction TalibHub

## Vue d'Ensemble

Le système de traduction TalibHub est conçu pour gérer efficacement les traductions dans l'application avec une séparation claire entre le contenu statique et les notifications dynamiques.

## 🏗️ Architecture

```
translations/
├── README.md                        # 📖 Cette documentation
├── TranslationManager.js            # 🎯 Coordinateur principal
├── static/                          # 📄 Interface utilisateur
│   ├── StaticTranslationManager.js  # Gestionnaire UI
│   ├── ui.fr.json                  # Labels, navigation (FR)
│   └── ui.en.json                  # Labels, navigation (EN)
└── dynamic/                         # 🔔 Messages dynamiques
    ├── NotificationTranslationManager.js  # Gestionnaire notifications
    ├── notifications.fr.json       # Notifications, erreurs (FR)
    └── notifications.en.json       # Notifications, erreurs (EN)
```

## 🎯 Composants Principaux

### 1. TranslationManager (Coordinateur)

- **Rôle :** Coordonne tous les gestionnaires de traduction
- **Fonctions :** Détection automatique de langue, changement de langue, API unifiée
- **Méthodes principales :**
  - `t(key)` - Traductions statiques
  - `tn(key)` - Traductions dynamiques
  - `setLanguage(lang)` - Changement de langue

### 2. StaticTranslationManager

- **Rôle :** Gère l'interface utilisateur (labels, boutons, navigation)
- **Fonctions :** Mise à jour automatique du DOM, gestion des attributs HTML
- **Fichiers :** `ui.fr.json`, `ui.en.json`

### 3. NotificationTranslationManager

- **Rôle :** Gère les messages temporaires (notifications, alertes, confirmations)
- **Fonctions :** Support des variables dynamiques, gestion des erreurs
- **Fichiers :** `notifications.fr.json`, `notifications.en.json`

## 🚀 Utilisation

### Initialisation

```javascript
// Automatique lors du chargement de l'application
await translationManager.init();
```

### Traductions Statiques (Interface)

```javascript
// Labels et boutons
translationManager.t("navigation.dashboard"); // → "Tableau de bord"
translationManager.t("buttons.save"); // → "Sauvegarder"

// Avec valeur par défaut
translationManager.t("missing.key", "Défaut"); // → "Défaut"

// Avec variables
translationManager.translateDynamic("welcome.user", { name: "Jean" });
// → "Bienvenue Jean"
```

### Traductions Dynamiques (Notifications)

```javascript
// Messages de notification
translationManager.tn("mosque.city.selected"); // → "Ville sélectionnée"
translationManager.tn("surah.quick.selectAll"); // → "Tout sélectionner"

// Avec variables
translationManager.tn("surah.level.selected", { level: 3 });
// → "Sourates niveau 3 sélectionnées"

// Dans notificationService
notificationService.show("mosque.city.selected", "success");
```

### Mise à Jour DOM Automatique

```html
<!-- Éléments avec data-i18n se mettent à jour automatiquement -->
<button data-i18n="buttons.save">Sauvegarder</button>
<input data-i18n-placeholder="form.username" placeholder="Nom d'utilisateur" />
```

## 📝 Structure des Fichiers JSON

### Format Hiérarchique Obligatoire

```json
{
  "section": {
    "subsection": {
      "key": "Valeur traduite"
    }
  }
}
```

### Exemple Correct

```json
{
  "mosque": {
    "city": {
      "selected": "Ville sélectionnée avec succès",
      "error": "Erreur lors de la sélection"
    },
    "scraping": {
      "started": "Récupération en cours...",
      "completed": "Récupération terminée"
    }
  }
}
```

### ❌ Format Incorrect (À Éviter)

```json
{
  "mosque": {
    "city.selected": "...", // ❌ Point dans le nom de clé
    "scraping.started": "..." // ❌ Cause des erreurs de résolution
  }
}
```

## 🔄 Changement de Langue

### Automatique (Recommandé)

```html
<!-- Boutons avec configuration automatique -->
<button class="lang-btn" data-lang="fr">Français</button>
<button class="lang-btn" data-lang="en">English</button>
```

### Programmatique

```javascript
// Changement manuel
await translationManager.setLanguage("fr");

// Écouter les changements
translationManager.onLanguageChange((newLang) => {
  console.log(`Langue changée vers: ${newLang}`);
});
```

## 🔍 Détection de Langue

Le système détecte automatiquement la langue selon cette priorité :

1. **localStorage** (`userLang`) - Préférence sauvegardée
2. **Navigateur** (`navigator.language`) - Langue du système
3. **Défaut** (`en`) - Anglais par défaut

```javascript
// Exemple de détection
localStorage.getItem("userLang"); // → "fr" (priorité 1)
navigator.language; // → "fr-FR" (priorité 2)
// Résultat: "fr"
```

## 🛠️ API Complète

### Méthodes de Traduction

| Méthode                       | Usage                   | Type      | Exemple                               |
| ----------------------------- | ----------------------- | --------- | ------------------------------------- |
| `t(key, default)`             | Interface statique      | Statique  | `t("buttons.save")`                   |
| `tn(key, vars, default)`      | Notifications           | Dynamique | `tn("auth.success")`                  |
| `translateDynamic(key, vars)` | Statique avec variables | Statique  | `translateDynamic("welcome", {name})` |

### Méthodes de Gestion

| Méthode                | Description         | Exemple                |
| ---------------------- | ------------------- | ---------------------- |
| `setLanguage(lang)`    | Change la langue    | `setLanguage("fr")`    |
| `getCurrentLanguage()` | Langue actuelle     | `→ "fr"`               |
| `onLanguageChange(cb)` | Écouter changements | `onLanguageChange(fn)` |

### Méthodes Utilitaires

| Méthode                           | Description                    | Exemple               |
| --------------------------------- | ------------------------------ | --------------------- |
| `hasStaticTranslation(key)`       | Vérifier existence (statique)  | `→ true/false`        |
| `hasNotificationTranslation(key)` | Vérifier existence (dynamique) | `→ true/false`        |
| `updateDOM()`                     | Force mise à jour DOM          | `updateDOM()`         |
| `forceReload()`                   | Recharge traductions           | `await forceReload()` |

## 🔧 Configuration et Personnalisation

### Ajout d'une Nouvelle Langue

1. Créer `ui.{lang}.json` dans `static/`
2. Créer `notifications.{lang}.json` dans `dynamic/`
3. Copier la structure des fichiers existants
4. Traduire toutes les clés

### Ajout de Nouvelles Clés

1. **Pour l'interface :** Ajouter dans `ui.{lang}.json`
2. **Pour les notifications :** Ajouter dans `notifications.{lang}.json`
3. Respecter la structure hiérarchique
4. Ajouter dans toutes les langues supportées

### Exemple d'Ajout

```json
// Dans ui.fr.json et ui.en.json
{
  "new_section": {
    "new_subsection": {
      "new_key": "Nouvelle valeur"
    }
  }
}
```

## 🐛 Debug et Diagnostic

### Logs de Debug

Le système affiche des logs détaillés :

```
🚀 Initialisation du TranslationManager...
📚 Initialisation des gestionnaires de traductions...
🌐 Langue détectée: fr
🔧 Application de la langue: fr
📄 Traductions statiques chargées pour fr
🔔 Notifications dynamiques chargées pour fr
✅ TranslationManager principal initialisé
```

### Erreurs Communes et Solutions

#### Clé Non Trouvée

```
⚠️ [NOTIFICATION] Traduction manquante pour: mosque.city.selected
```

**Solution :** Vérifier que la clé existe dans le fichier JSON correspondant avec la bonne structure hiérarchique.

#### Structure JSON Incorrecte

```
🔍 [DEBUG] hasTranslation: false
```

**Solution :** S'assurer d'utiliser la structure hiérarchique sans points dans les noms de clés.

### Commandes de Debug

```javascript
// Vérifier toutes les traductions
console.log(translationManager.getAllTranslations());

// Vérifier existence d'une clé
console.log(translationManager.hasStaticTranslation("navigation.home"));
console.log(translationManager.hasNotificationTranslation("auth.success"));

// État actuel
console.log("Langue:", translationManager.getCurrentLanguage());
```

## 🎯 Bonnes Pratiques

### 1. Nommage des Clés

- Utiliser des noms descriptifs et hiérarchiques
- Préfixer par section logique (`navigation.`, `buttons.`, `forms.`)
- Éviter les points dans les noms de clés finales

### 2. Organisation des Traductions

- **Statique :** Navigation, formulaires, labels permanents
- **Dynamique :** Messages temporaires, notifications, confirmations

### 3. Gestion des Variables

```javascript
// ✅ Bon usage avec variables
translationManager.tn("surah.level.selected", { level: 3 });

// ❌ Éviter la concaténation manuelle
"Sourates niveau " + level + " sélectionnées";
```

### 4. Fallbacks et Défauts

```javascript
// ✅ Toujours fournir une valeur par défaut sensée
translationManager.t("unknown.key", "Texte par défaut");

// ❌ Éviter les clés sans fallback
translationManager.t("unknown.key"); // Retourne la clé brute
```

## 📈 Performance

- **Chargement paresseux :** Les traductions sont chargées seulement quand nécessaire
- **Cache navigateur :** Les fichiers JSON sont mis en cache
- **Mise à jour sélective :** Seuls les éléments nécessaires sont mis à jour lors du changement de langue
- **Gestion d'erreur :** L'application continue de fonctionner même si les traductions échouent

## 🔄 Migration depuis l'Ancien Système

Si vous migrez depuis l'ancien système :

1. **Remplacer :** `window.translationManager.t()` → `translationManager.t()`
2. **Notifications :** Utiliser `translationManager.tn()` au lieu de `t()`
3. **Structure :** Convertir les clés avec points en structure hiérarchique
4. **Fichiers :** Séparer les traductions entre `static/` et `dynamic/`

## 🤝 Contribution

Pour contribuer au système de traduction :

1. Respecter la structure hiérarchique
2. Tester dans toutes les langues supportées
3. Ajouter des logs de debug appropriés
4. Mettre à jour cette documentation si nécessaire

## 📞 Support

En cas de problème avec le système de traduction :

1. Vérifier les logs de la console
2. S'assurer que la structure JSON est correcte
3. Tester avec `translationManager.forceReload()`
4. Consulter cette documentation

---

_Dernière mise à jour : Juin 2025_
_Version : 2.0 (Système hiérarchique complet)_
