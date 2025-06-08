# Système de Traduction TalibHub

## Vue d'ensemble

Le système de traduction de TalibHub permet un changement de langue dynamique sans rechargement de page entre le français et l'anglais. Il utilise un système basé sur des attributs HTML `data-translate` et un gestionnaire de traduction centralisé.

## Architecture

### Structure des fichiers

```
Front-End/utils/
├── translations.js          # Gestionnaire principal + traductions
└── README-TRANSLATION-SYSTEM.md  # Ce documentation
```

### Composants principaux

1. **TranslationManager** : Classe principale qui gère les traductions
2. **Dictionnaire de traductions** : Contient toutes les clés français/anglais
3. **Système d'attributs HTML** : `data-translate`, `data-translate-placeholder`, etc.

## Utilisation

### 1. Ajout d'attributs de traduction dans le HTML

#### Traduction de texte standard

```html
<h1 data-translate="welcomepage.title">Bienvenue sur TalibHub</h1>
<p data-translate="aboutus.mission">Notre mission est de...</p>
```

#### Traduction de placeholders

```html
<input
  type="text"
  data-translate-placeholder="profile.usernamePlaceholder"
  placeholder="pseudo"
/>
```

#### Traduction de titres (tooltips)

```html
<button data-translate-title="navigation.dashboard" title="Tableau de bord">
  Dashboard
</button>
```

#### Traduction avec HTML complexe

```html
<h2 data-translate="contactform.talkAbout">
  Discutons<br />de quelque chose de<br />
  <span class="contactform-highlight">génial</span><br />ensemble
</h2>
```

### 2. Changement de langue

#### Via les boutons de langue

```html
<button class="lang-btn" data-lang="fr">🇫🇷</button>
<button class="lang-btn" data-lang="en">🇬🇧</button>
```

#### Programmatiquement

```javascript
// Via le gestionnaire global
window.translationManager.setLanguage("fr");
window.translationManager.setLanguage("en");

// Obtenir la langue actuelle
const currentLang = window.translationManager.getCurrentLanguage();
```

## Ajout de nouvelles traductions

### 1. Structure des clés

Les clés suivent une hiérarchie logique :

```
section.element.type
```

Exemples :

- `profile.title` → Titre de la section profile
- `profile.username` → Label pour le champ username
- `profile.usernamePlaceholder` → Placeholder du champ username
- `surahmemorization.selectForRevision` → Texte de sélection des sourates

### 2. Ajout dans translations.js

```javascript
// Section française
fr: {
  // ... autres traductions
  "nouvelleSection.titre": "Nouveau Titre",
  "nouvelleSection.description": "Description en français",
  "nouvelleSection.bouton": "Cliquez ici",
}

// Section anglaise
en: {
  // ... autres traductions
  "nouvelleSection.titre": "New Title",
  "nouvelleSection.description": "English description",
  "nouvelleSection.bouton": "Click here",
}
```

### 3. Utilisation dans le HTML

```html
<h2 data-translate="nouvelleSection.titre">Nouveau Titre</h2>
<p data-translate="nouvelleSection.description">Description en français</p>
<button data-translate="nouvelleSection.bouton">Cliquez ici</button>
```

## Gestion du HTML complexe

### Problèmes fréquents

Le système gère automatiquement le HTML complexe avec des balises imbriquées :

```html
<!-- ✅ Correct - Le HTML est inclus dans la traduction -->
<h2 data-translate="contactform.talkAbout">
  Let's talk<br />about something<br />
  <span class="contactform-highlight">awesome</span><br />together
</h2>
```

Traduction correspondante :

```javascript
"contactform.talkAbout": "Let's talk<br />about something<br /><span class=\"contactform-highlight\">awesome</span><br />together"
```

### Méthode translateElementWithIcons

Cette méthode spéciale préserve la structure HTML tout en traduisant le contenu :

```javascript
translateElementWithIcons(element, translation) {
  // Préservation de la structure HTML originale
  // Remplacement intelligent du texte
  // Gestion des éléments imbriqués (spans, br, etc.)
}
```

## Intégration dans les composants

### Initialisation automatique

Le système s'initialise automatiquement au chargement de la page :

```javascript
// Dans translations.js
document.addEventListener("DOMContentLoaded", () => {
  window.translationManager = new TranslationManager();
});
```

### Écoute des changements de langue

Pour les composants dynamiques, utilisez l'observateur de langue :

```javascript
// Exemple dans duaTimeCalculator.js
function setupLanguageObserver() {
  if (window.translationManager) {
    window.translationManager.addLanguageChangeListener(
      updateTimeDisplayTranslated
    );
  } else {
    // Retry avec délai si translationManager n'est pas encore prêt
    setTimeout(setupLanguageObserver, 100);
  }
}

function updateTimeDisplayTranslated() {
  // Logique de mise à jour des traductions dynamiques
  if (currentResults) {
    const fajrText = window.translationManager.translate(
      "duaTimeCalculator.fajr"
    );
    // ... mise à jour du contenu
  }
}
```

## Sections traduites

### Actuellement implémentées

- ✅ **Navigation** : Menu principal, sous-menus
- ✅ **Profile** : Formulaires, champs, boutons
- ✅ **Price/Contribution** : Plans tarifaires complets
- ✅ **About Us** : Mission, valeurs, fonctionnalités
- ✅ **Contact** : Titre et contenu principal
- ✅ **DuaTime Calculator** : Résultats dynamiques
- ✅ **Surah Memorization** : Interface complète
- ✅ **Statistics** : Tableaux et labels
- ✅ **Timer/Tasks** : Tous les éléments d'interface

### Sections partielles

- 🔄 **Welcome Page** : Certains éléments manquants
- 🔄 **Dashboard** : Cartes principales traduites

## Bonnes pratiques

### 1. Nommage des clés

```javascript
// ✅ Bon - Hiérarchique et descriptif
"profile.personalInfo": "Informations Personnelles"
"profile.changePassword": "Changer le mot de passe"

// ❌ Éviter - Trop générique
"title": "Titre"
"button": "Bouton"
```

### 2. Gestion du HTML

```javascript
// ✅ Bon - HTML inclus dans la traduction
"contactform.talkAbout": "Discutons<br />de quelque chose de<br /><span class=\"highlight\">génial</span>"

// ❌ Éviter - HTML séparé
"contactform.talkAbout": "Discutons de quelque chose de génial"
```

### 3. Consistance des traductions

```javascript
// ✅ Bon - Même terminologie
"profile.update": "Mettre à jour"
"profile.save": "Enregistrer"

// ❌ Éviter - Terminologie incohérente
"profile.update": "Mettre à jour"
"profile.save": "Sauvegarder"
```

## Debugging

### Vérification du système

```javascript
// Dans la console du navigateur
console.log(window.translationManager); // Doit être défini
console.log(window.translationManager.getCurrentLanguage()); // 'fr' ou 'en'
console.log(window.translationManager.translate("profile.title")); // Traduction correspondante
```

### Logs de debugging

Le système inclut des logs pour le debugging :

```javascript
console.log("[TRANSLATION] Language changed to:", newLanguage);
console.log("[TRANSLATION] Elements updated:", elementsCount);
```

## Troubleshooting

### Problème : Traductions ne s'appliquent pas

1. Vérifier que `utils/translations.js` est importé dans `index.html`
2. S'assurer que les clés existent dans les deux langues
3. Vérifier la syntaxe des attributs `data-translate`

### Problème : HTML cassé après traduction

1. Vérifier que le HTML est correctement échappé dans les traductions
2. Utiliser `translateElementWithIcons` pour les éléments complexes
3. Tester avec et sans HTML dans les traductions

### Problème : Composants dynamiques non traduits

1. Implémenter un observateur de langue dans le composant
2. Utiliser `window.translationManager.addLanguageChangeListener()`
3. Ajouter une logique de retry si translationManager n'est pas prêt

## Performance

### Optimisations implémentées

- ✅ Cache des éléments traduits
- ✅ Traduction à la demande (lazy translation)
- ✅ Évitement de la re-traduction des éléments non modifiés
- ✅ Gestion optimisée des observateurs de changement

### Métriques

- **Fichier translations.js** : ~30KB (compressé)
- **Nombre de clés** : 680+ traductions (fr + en)
- **Initialisation** : < 50ms
- **Changement de langue** : < 100ms

## Maintenance

### Ajout d'une nouvelle section

1. Identifier tous les éléments à traduire
2. Créer les clés hiérarchiques appropriées
3. Ajouter les traductions fr/en
4. Implémenter les attributs dans le HTML
5. Tester les deux langues
6. Ajouter un observateur si nécessaire (contenu dynamique)

### Modification d'une traduction existante

1. Localiser la clé dans `translations.js`
2. Modifier les versions fr ET en
3. Tester l'affichage dans les deux langues
4. Vérifier les éléments HTML complexes

---

_Dernière mise à jour : Décembre 2024_
_Version du système : 2.0_
